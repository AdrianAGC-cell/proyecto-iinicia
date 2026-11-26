<?php

namespace local_iinicia\external;

defined('MOODLE_INTERNAL') || die();

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use core_external\util;

class exchange_identity extends external_api {

    public static function execute_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'Moodle user ID'),
            'owner' => new external_value(PARAM_RAW, 'Supabase identity')
        ]);
    }

    public static function execute($userid, $owner) {
        global $DB, $USER;

        $params = self::validate_parameters(
            self::execute_parameters(),
            [
                'userid' => $userid,
                'owner' => $owner
            ]
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

        $owner = strtolower($params['owner']);

        if (!preg_match(
            '/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/D',
            $owner
        )) {
            throw new \invalid_parameter_exception(
                'Identidad invalida'
            );
        }

        $identificador = str_replace('-', '', $owner);

        $usuario = $DB->get_record('user', [
            'id' => $params['userid'],
            'username' => 'iinicia_' . $identificador,
            'idnumber' => 'IIN-' . strtoupper(
                substr($identificador, 0, 16)
            ),
            'deleted' => 0,
            'suspended' => 0,
            'confirmed' => 1,
            'auth' => 'manual'
        ], '*', MUST_EXIST);

        \core_user::require_active_user($usuario, true, true);

        if (is_siteadmin($usuario)) {
            throw new \invalid_parameter_exception(
                'Cuenta no autorizada'
            );
        }

        $roles = $DB->get_records_sql(
            "SELECT ra.id, r.shortname, c.contextlevel
               FROM {role_assignments} ra
               JOIN {role} r ON r.id = ra.roleid
               JOIN {context} c ON c.id = ra.contextid
              WHERE ra.userid = :userid",
            ['userid' => $usuario->id]
        );

        $estudiante = false;

        foreach ($roles as $rol) {
            if (
                $rol->shortname !== 'student' ||
                (int)$rol->contextlevel !== CONTEXT_COURSE
            ) {
                throw new \invalid_parameter_exception(
                    'Perfil institucional incompatible'
                );
            }

            $estudiante = true;
        }

        if (!$estudiante || !enrol_get_users_courses(
            $usuario->id,
            true
        )) {
            throw new \invalid_parameter_exception(
                'Estudiante sin matricula activa'
            );
        }

        $servicio = $DB->get_record(
            'external_services',
            [
                'shortname' => MOODLE_OFFICIAL_MOBILE_SERVICE,
                'enabled' => 1
            ],
            '*',
            MUST_EXIST
        );

        if (!empty($servicio->restrictedusers)) {
            throw new \invalid_parameter_exception(
                'Servicio movil restringido'
            );
        }

        if (!has_capability(
            'moodle/webservice:createmobiletoken',
            $context,
            $usuario->id
        )) {
            throw new \invalid_parameter_exception(
                'Usuario sin permiso de acceso movil'
            );
        }

        $expira = time() + 3600;

        $token = util::generate_token(
            EXTERNAL_TOKEN_PERMANENT,
            $servicio,
            $usuario->id,
            $context,
            $expira,
            '',
            'IINICIA institutional session'
        );

        return [
            'success' => true,
            'userid' => (int)$usuario->id,
            'token' => $token,
            'expires' => $expira
        ];
    }

    public static function execute_returns() {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL),
            'userid' => new external_value(PARAM_INT),
            'token' => new external_value(PARAM_RAW),
            'expires' => new external_value(PARAM_INT)
        ]);
    }
}
