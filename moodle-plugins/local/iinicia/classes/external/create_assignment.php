<?php
namespace local_iinicia\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

defined('MOODLE_INTERNAL') || die();

class create_assignment extends external_api {

    public static function execute_parameters() {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT),
            'section' => new external_value(PARAM_INT),
            'name' => new external_value(PARAM_TEXT),
            'description' => new external_value(PARAM_TEXT),
            'availablefrom' => new external_value(PARAM_INT),
            'duedate' => new external_value(PARAM_INT),
            'cutoffdate' => new external_value(PARAM_INT),
            'grade' => new external_value(PARAM_INT),
            'maxfiles' => new external_value(PARAM_INT),
            'maxbytes' => new external_value(PARAM_INT),
            'visible' => new external_value(PARAM_BOOL)
        ]);
    }

    public static function execute(
        $courseid, $section, $name, $description,
        $availablefrom, $duedate, $cutoffdate,
        $grade, $maxfiles, $maxbytes, $visible
    ) {
        global $CFG, $DB, $USER;

        require_once($CFG->dirroot . '/course/modlib.php');
        require_once($CFG->dirroot . '/mod/assign/lib.php');

        $p = (object) self::validate_parameters(
            self::execute_parameters(),
            compact(
                'courseid', 'section', 'name', 'description',
                'availablefrom', 'duedate', 'cutoffdate',
                'grade', 'maxfiles', 'maxbytes', 'visible'
            )
        );

        if ($p->courseid <= 1 || $p->section < 0) {
            throw new \invalid_parameter_exception('Curso o seccion invalida');
        }

        $course = get_course($p->courseid);
        $context = \context_course::instance($course->id);

        self::validate_context($context);

        require_capability('moodle/course:manageactivities', $context);
        require_capability('mod/assign:addinstance', $context);

        if (!is_enrolled($context, $USER, '', true) &&
            !is_siteadmin($USER)) {
            throw new \moodle_exception('nopermissions', 'error');
        }

        if (!$DB->record_exists('course_sections', [
            'course' => $course->id,
            'section' => $p->section
        ])) {
            throw new \invalid_parameter_exception('Seccion inexistente');
        }

        $p->name = trim($p->name);

        if ($p->name === '' || \core_text::strlen($p->name) > 200 ||
            \core_text::strlen($p->description) > 10000) {
            throw new \invalid_parameter_exception('Nombre o descripcion invalida');
        }

        if ($p->grade < 1 || $p->grade > 100) {
            throw new \invalid_parameter_exception('Calificacion maxima invalida');
        }

        $limit = min(10, (int)get_config('assignsubmission_file', 'maxfiles'));

        if ($p->maxfiles < 1 || $p->maxfiles > $limit) {
            throw new \invalid_parameter_exception('Cantidad de archivos invalida');
        }

        $maxupload = get_max_upload_file_size(
            $CFG->maxbytes,
            $course->maxbytes,
            get_config('assignsubmission_file', 'maxbytes')
        );

        if ($p->maxbytes < 1 ||
            $p->maxbytes > 20 * 1024 * 1024 ||
            ($maxupload > 0 && $p->maxbytes > $maxupload)) {
            throw new \invalid_parameter_exception('Tamano de archivo invalido');
        }

        if ($p->availablefrom < 0 ||
            $p->duedate <= 0 ||
            $p->cutoffdate < 0 ||
            $p->duedate <= $p->availablefrom ||
            ($p->cutoffdate && $p->cutoffdate < $p->duedate)) {
            throw new \invalid_parameter_exception('Fechas invalidas');
        }

        [$module] = can_add_moduleinfo(
            $course, 'assign', $p->section
        );

        $data = (object) [
            'course' => $course->id,
            'module' => $module->id,
            'modulename' => 'assign',
            'section' => $p->section,
            'name' => $p->name,
            'intro' => $p->description,
            'introformat' => FORMAT_PLAIN,
            'visible' => (int)$p->visible,
            'visibleoncoursepage' => 1,
            'showdescription' => 0,
            'alwaysshowdescription' => 1,
            'groupmode' => 0,
            'groupingid' => 0,
            'completion' => 0,
            'completionview' => 0,
            'completionexpected' => 0,
            'submissiondrafts' => 1,
            'requiresubmissionstatement' => 0,
            'sendnotifications' => 0,
            'sendlatenotifications' => 0,
            'sendstudentnotifications' => 1,
            'allowsubmissionsfromdate' => $p->availablefrom,
            'duedate' => $p->duedate,
            'cutoffdate' => $p->cutoffdate,
            'gradingduedate' => 0,
            'grade' => $p->grade,
            'teamsubmission' => 0,
            'requireallteammemberssubmit' => 0,
            'teamsubmissiongroupingid' => 0,
            'blindmarking' => 0,
            'markingworkflow' => 0,
            'markingallocation' => 0,
            'maxattempts' => 1,
            'attemptreopenmethod' => 'none',
            'assignsubmission_file_enabled' => 1,
            'assignsubmission_file_maxfiles' => $p->maxfiles,
            'assignsubmission_file_maxsizebytes' => $p->maxbytes,
            'assignsubmission_file_filetypes' => '.pdf',
            'assignsubmission_onlinetext_enabled' => 0,
            'assignfeedback_comments_enabled' => 1,
            'assignfeedback_file_enabled' => 0,
            'assignfeedback_editpdf_enabled' => 0,
            'assignfeedback_offline_enabled' => 0
        ];

        $result = add_moduleinfo($data, $course);

        return [
            'success' => true,
            'courseid' => $course->id,
            'assignid' => $result->instance,
            'cmid' => $result->coursemodule
        ];
    }

    public static function execute_returns() {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL),
            'courseid' => new external_value(PARAM_INT),
            'assignid' => new external_value(PARAM_INT),
            'cmid' => new external_value(PARAM_INT)
        ]);
    }
}
