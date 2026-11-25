<?php

namespace local_iinicia\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_multiple_structure;
use core_external\external_value;

class cancel_status extends external_api {

    public static function execute_parameters() {
        return new external_function_parameters([
            'assignid' => new external_value(
                PARAM_INT, 'Assignment ID'
            )
        ]);
    }

    public static function execute($assignid) {
        global $DB, $USER;

        $params = self::validate_parameters(
            self::execute_parameters(),
            ['assignid' => $assignid]
        );

        $assignid = $params['assignid'];

        $cm = get_coursemodule_from_instance(
            'assign', $assignid, 0, false, MUST_EXIST
        );

        $context = \context_module::instance($cm->id);

        self::validate_context($context);

        $instance = $DB->get_record(
            'assign',
            ['id' => $assignid],
            '*',
            MUST_EXIST
        );

        $compatible =
            !empty($instance->submissiondrafts) &&
            empty($instance->teamsubmission) &&
            empty($instance->blindmarking) &&
            empty($instance->markingworkflow) &&
            empty($instance->requiresubmissionstatement) &&
            groups_get_activity_groupmode($cm) == NOGROUPS;

        $conditions = [
            'assignid' => $assignid
        ];

        if (has_capability('mod/assign:grade', $context)) {

            $role = 'teacher';

        } else {

            require_capability('mod/assign:submit', $context);

            if (!is_enrolled(
                $context, $USER->id, 'mod/assign:submit', true
            )) {
                throw new \required_capability_exception(
                    $context,
                    'mod/assign:submit',
                    'nopermissions',
                    ''
                );
            }

            $role = 'student';
            $conditions['userid'] = $USER->id;
        }

        if (!$compatible) {
            return [
                'success' => true,
                'compatible' => false,
                'role' => $role,
                'requests' => []
            ];
        }

        $records = $DB->get_records(
            'local_iinicia_cancel',
            $conditions,
            'id DESC'
        );

        $requests = [];

        foreach ($records as $record) {

            $requests[] = [
                'requestid' => (int)$record->id,
                'userid' => (int)$record->userid,
                'assignid' => (int)$record->assignid,
                'attemptnumber' => (int)$record->attemptnumber,
                'status' => $record->status,
                'timecreated' => (int)$record->timecreated,
                'timemodified' => (int)$record->timemodified,
                'reviewerid' => (int)($record->reviewerid ?? 0)
            ];
        }

        return [
            'success' => true,
            'compatible' => true,
            'role' => $role,
            'requests' => $requests
        ];
    }

    public static function execute_returns() {
        return new external_single_structure([
            'success' => new external_value(
                PARAM_BOOL, 'Success'
            ),
            'compatible' => new external_value(
                PARAM_BOOL, 'Supported assignment'
            ),
            'role' => new external_value(
                PARAM_TEXT, 'Current permissions'
            ),
            'requests' => new external_multiple_structure(
                new external_single_structure([
                    'requestid' => new external_value(
                        PARAM_INT, 'Request ID'
                    ),
                    'userid' => new external_value(
                        PARAM_INT, 'Student ID'
                    ),
                    'assignid' => new external_value(
                        PARAM_INT, 'Assignment ID'
                    ),
                    'attemptnumber' => new external_value(
                        PARAM_INT, 'Attempt'
                    ),
                    'status' => new external_value(
                        PARAM_TEXT, 'Status'
                    ),
                    'timecreated' => new external_value(
                        PARAM_INT, 'Creation time'
                    ),
                    'timemodified' => new external_value(
                        PARAM_INT, 'Modification time'
                    ),
                    'reviewerid' => new external_value(
                        PARAM_INT, 'Reviewer ID'
                    )
                ])
            )
        ]);
    }
}
