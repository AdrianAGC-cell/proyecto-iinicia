<?php

namespace local_iinicia\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

defined('MOODLE_INTERNAL') || die();

class course_permissions extends external_api {

    public static function execute_parameters() {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT)
        ]);
    }

    public static function execute($courseid) {
        global $USER;

        $p = self::validate_parameters(
            self::execute_parameters(),
            compact('courseid')
        );

        $context = \context_course::instance($p['courseid']);

        self::validate_context($context);

        $acceso = is_enrolled($context, $USER, '', true)
            || is_siteadmin($USER);

        $gestionar = $acceso && has_capability(
            'moodle/course:manageactivities',
            $context
        );

        return [
            'courseid' => $p['courseid'],
            'canmanage' => $gestionar,
            'cancreate' => $gestionar && has_capability(
                'mod/assign:addinstance', $context
            ),
            'canviewhidden' => $gestionar && has_capability(
                'moodle/course:viewhiddenactivities', $context
            ),
            'canvisibility' => $gestionar && has_capability(
                'moodle/course:activityvisibility', $context
            )
        ];
    }

    public static function execute_returns() {
        return new external_single_structure([
            'courseid' => new external_value(PARAM_INT),
            'canmanage' => new external_value(PARAM_BOOL),
            'cancreate' => new external_value(PARAM_BOOL),
            'canviewhidden' => new external_value(PARAM_BOOL),
            'canvisibility' => new external_value(PARAM_BOOL)
        ]);
    }
}
