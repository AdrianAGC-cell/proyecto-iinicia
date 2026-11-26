<?php

namespace local_iinicia\external;

defined('MOODLE_INTERNAL') || die();

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

class revoke_identity extends external_api {

    public static function execute_parameters() {
        return new external_function_parameters([
            'token' => new external_value(PARAM_RAW)
        ]);
    }

    public static function execute($token) {
        global $DB, $USER;

        $params = self::validate_parameters(
            self::execute_parameters(),
            ['token' => $token]
        );

        $context = \context_system::instance();

        self::validate_context($context);

        require_capability(
            'local/iinicia:exchangeidentity',
            $context
        );

        if ($USER->username !== 'iinicia_bridge') {
            throw new \invalid_parameter_exception(
                'Servicio no autorizado'
            );
        }

        if (!preg_match(
            '/^[a-f0-9]{32}$/D',
            $params['token']
        )) {
            throw new \invalid_parameter_exception(
                'Token invalido'
            );
        }

        $registro = $DB->get_record_sql(
            "SELECT t.id
               FROM {external_tokens} t
               JOIN {user} u ON u.id = t.userid
               JOIN {external_services} s
                 ON s.id = t.externalserviceid
              WHERE t.token = :token
                AND t.creatorid = :creator
                AND t.name = :name
                AND s.shortname = :service
                AND u.username LIKE :username",
            [
                'token' => $params['token'],
                'creator' => $USER->id,
                'name' => 'IINICIA institutional session',
                'service' => MOODLE_OFFICIAL_MOBILE_SERVICE,
                'username' => 'iinicia\_%'
            ]
        );

        if ($registro) {
            $DB->delete_records(
                'external_tokens',
                ['id' => $registro->id]
            );
        }

        return ['success' => true];
    }

    public static function execute_returns() {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL)
        ]);
    }
}
