<?php

namespace local_iinicia\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_multiple_structure;
use core_external\external_value;

defined('MOODLE_INTERNAL') || die();

class assignment_settings extends external_api {

    public static function execute_parameters() {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT),
            'cmid' => new external_value(PARAM_INT)
        ]);
    }

    public static function execute($courseid, $cmid) {
        global $DB, $USER, $CFG;

        require_once($CFG->dirroot . '/mod/assign/locallib.php');

        $p = self::validate_parameters(
            self::execute_parameters(),
            compact('courseid', 'cmid')
        );

        $course = get_course($p['courseid']);
        $context = \context_course::instance($course->id);

        self::validate_context($context);

        require_capability(
            'moodle/course:manageactivities',
            $context
        );

        if (!is_enrolled($context, $USER, '', true) &&
            !is_siteadmin($USER)) {
            throw new \moodle_exception('nopermissions', 'error');
        }

        $cm = get_coursemodule_from_id(
            'assign',
            $p['cmid'],
            $course->id,
            false,
            MUST_EXIST
        );

        if ((int)$cm->course !== (int)$course->id) {
            throw new \invalid_parameter_exception('Curso incorrecto');
        }

        $ctx = \context_module::instance($cm->id);

        self::validate_context($ctx);

        require_capability(
            'moodle/course:manageactivities',
            $ctx
        );

        $assignment = $DB->get_record(
            'assign',
            [
                'id' => $cm->instance,
                'course' => $course->id
            ],
            '*',
            MUST_EXIST
        );

        $files = get_file_storage()->get_area_files(
            $ctx->id,
            'mod_assign',
            ASSIGN_INTROATTACHMENT_FILEAREA,
            0,
            'filename ASC',
            false
        );

        $attachments = [];

        foreach ($files as $file) {
            $attachments[] = [
                'filename' => $file->get_filename(),
                'filesize' => $file->get_filesize(),
                'mimetype' => $file->get_mimetype()
            ];
        }

        return [
            'success' => true,
            'courseid' => $course->id,
            'cmid' => $cm->id,
            'assignid' => $assignment->id,
            'name' => $assignment->name,
            'description' => $assignment->intro,
            'descriptionformat' => $assignment->introformat,
            'availablefrom' => $assignment->allowsubmissionsfromdate,
            'duedate' => $assignment->duedate,
            'cutoffdate' => $assignment->cutoffdate,
            'grade' => $assignment->grade,
            'visible' => (bool)$cm->visible,
            'modified' => $assignment->timemodified,
            'attachments' => $attachments
        ];
    }

    public static function execute_returns() {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL),
            'courseid' => new external_value(PARAM_INT),
            'cmid' => new external_value(PARAM_INT),
            'assignid' => new external_value(PARAM_INT),
            'name' => new external_value(PARAM_TEXT),
            'description' => new external_value(PARAM_RAW),
            'descriptionformat' => new external_value(PARAM_INT),
            'availablefrom' => new external_value(PARAM_INT),
            'duedate' => new external_value(PARAM_INT),
            'cutoffdate' => new external_value(PARAM_INT),
            'grade' => new external_value(PARAM_FLOAT),
            'visible' => new external_value(PARAM_BOOL),
            'modified' => new external_value(PARAM_INT),
            'attachments' => new external_multiple_structure(
                new external_single_structure([
                    'filename' => new external_value(PARAM_FILE),
                    'filesize' => new external_value(PARAM_INT),
                    'mimetype' => new external_value(PARAM_TEXT)
                ])
            )
        ]);
    }
}
