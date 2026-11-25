<?php

namespace local_iinicia\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

class assignment_permissions extends external_api {

    public static function execute_parameters() {
        return new external_function_parameters([
            'assignid' => new external_value(
                PARAM_INT, 'Assignment ID'
            )
        ]);
    }

    public static function execute($assignid) {

        $params = self::validate_parameters(
            self::execute_parameters(),
            ['assignid' => $assignid]
        );

        $cm = get_coursemodule_from_instance(
            'assign', $params['assignid'],
            0, false, MUST_EXIST
        );

        $context = \context_module::instance($cm->id);

        self::validate_context($context);

        return [
            'courseid' => (int)$cm->course,
            'assignid' => (int)$cm->instance,
            'cangrade' => has_capability(
                'mod/assign:grade', $context
            ),
            'cansubmit' => has_capability(
                'mod/assign:submit', $context
            )
        ];
    }

    public static function execute_returns() {
        return new external_single_structure([
            'courseid' => new external_value(
                PARAM_INT, 'Course ID'
            ),
            'assignid' => new external_value(
                PARAM_INT, 'Assignment ID'
            ),
            'cangrade' => new external_value(
                PARAM_BOOL, 'Can grade'
            ),
            'cansubmit' => new external_value(
                PARAM_BOOL, 'Can submit'
            )
        ]);
    }
}
