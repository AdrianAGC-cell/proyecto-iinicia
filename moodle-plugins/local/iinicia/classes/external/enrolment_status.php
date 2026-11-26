<?php

namespace local_iinicia\external;

defined('MOODLE_INTERNAL') || die();

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

class enrolment_status extends external_api {

    public static function execute_parameters() {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Curso'),
            'userid' => new external_value(PARAM_INT, 'Usuario')
        ]);
    }

    public static function execute($courseid, $userid) {
        global $DB;

        $params = self::validate_parameters(
            self::execute_parameters(),
            [
                'courseid' => $courseid,
                'userid' => $userid
            ]
        );

        $courseid = $params['courseid'];
        $userid = $params['userid'];

        $context = \context_course::instance($courseid);

        self::validate_context($context);

        require_capability(
            'enrol/manual:enrol',
            $context
        );

        $user = $DB->get_record(
            'user',
            ['id' => $userid],
            'id,deleted,suspended',
            MUST_EXIST
        );

        $student = false;

        foreach (get_user_roles($context, $userid, false) as $role) {
            if ($role->shortname === 'student') {
                $student = true;
                break;
            }
        }

        return [
            'courseid' => $courseid,
            'userid' => $userid,
            'enrolled' => !$user->deleted &&
                !$user->suspended &&
                is_enrolled($context, $userid, '', true),
            'student' => $student
        ];
    }

    public static function execute_returns() {
        return new external_single_structure([
            'courseid' => new external_value(PARAM_INT, 'Curso'),
            'userid' => new external_value(PARAM_INT, 'Usuario'),
            'enrolled' => new external_value(PARAM_BOOL, 'Matricula activa'),
            'student' => new external_value(PARAM_BOOL, 'Rol estudiante')
        ]);
    }
}
