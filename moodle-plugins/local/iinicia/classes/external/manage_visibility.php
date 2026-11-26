<?php

namespace local_iinicia\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

defined('MOODLE_INTERNAL') || die();

class manage_visibility extends external_api {

    public static function execute_parameters() {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT),
            'cmid' => new external_value(PARAM_INT),
            'visible' => new external_value(PARAM_BOOL)
        ]);
    }

    public static function execute($courseid, $cmid, $visible) {
        global $CFG, $USER;

        require_once($CFG->dirroot . '/course/lib.php');

        $p = self::validate_parameters(
            self::execute_parameters(),
            compact('courseid', 'cmid', 'visible')
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

        $modulecontext = \context_module::instance($cm->id);

        self::validate_context($modulecontext);

        require_capability(
            'moodle/course:manageactivities',
            $modulecontext
        );

        require_capability(
            'moodle/course:activityvisibility',
            $modulecontext
        );

        set_coursemodule_visible(
            $cm->id,
            (int)$p['visible']
        );

        return [
            'success' => true,
            'cmid' => $cm->id,
            'visible' => (bool)$p['visible']
        ];
    }

    public static function execute_returns() {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL),
            'cmid' => new external_value(PARAM_INT),
            'visible' => new external_value(PARAM_BOOL)
        ]);
    }
}
