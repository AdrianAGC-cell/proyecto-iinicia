<?php
namespace local_iinicia\external;

defined('MOODLE_INTERNAL') || die();

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_multiple_structure;
use core_external\external_value;

class user_roles extends external_api {

    public static function execute_parameters() {
        return new external_function_parameters([]);
    }

    public static function execute() {
        global $USER, $DB;

        self::validate_context(\context_system::instance());

        if (!isloggedin() || isguestuser() || $USER->suspended) {
            throw new \moodle_exception('nopermissions', 'error');
        }

        $sql = "SELECT ra.id, r.shortname,
                       c.contextlevel, c.instanceid
                  FROM {role_assignments} ra
                  JOIN {role} r ON r.id = ra.roleid
                  JOIN {context} c ON c.id = ra.contextid
                 WHERE ra.userid = :userid";

        $assignments = $DB->get_records_sql(
            $sql,
            ['userid' => $USER->id]
        );

        $roles = [];

        foreach ($assignments as $assignment) {
            $roles[] = [
                'shortname' => $assignment->shortname,
                'contextlevel' => (int)$assignment->contextlevel,
                'instanceid' => (int)$assignment->instanceid
            ];
        }

        return [
            'userid' => (int)$USER->id,
            'siteadmin' => is_siteadmin($USER->id),
            'roles' => $roles
        ];
    }

    public static function execute_returns() {
        return new external_single_structure([
            'userid' => new external_value(PARAM_INT, 'User ID'),
            'siteadmin' => new external_value(PARAM_BOOL, 'Site administrator'),
            'roles' => new external_multiple_structure(
                new external_single_structure([
                    'shortname' => new external_value(PARAM_ALPHANUMEXT, 'Role'),
                    'contextlevel' => new external_value(PARAM_INT, 'Context level'),
                    'instanceid' => new external_value(PARAM_INT, 'Context instance')
                ])
            )
        ]);
    }
}
