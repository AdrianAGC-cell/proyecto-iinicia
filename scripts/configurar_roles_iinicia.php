<?php

define('CLI_SCRIPT', true);

require '/var/www/html/config.php';

global $DB;

$contexto = context_system::instance();

$permisos = [

    'iinicia_tecnico' => [
        'moodle/site:configview',
        'moodle/site:viewreports'
    ],

    'iinicia_academico' => [
        'moodle/category:manage',
        'moodle/category:viewcourselist',
        'moodle/category:viewhiddencategories',
        'moodle/course:create',
        'moodle/course:update',
        'moodle/course:view',
        'moodle/course:viewhiddencourses',
        'moodle/course:viewparticipants',
        'moodle/course:enrolreview',
        'moodle/cohort:view',
        'moodle/cohort:manage',
        'moodle/cohort:assign',
        'enrol/manual:enrol',
        'enrol/manual:unenrol'
    ],

    'iinicia_coordinador' => [
        'moodle/category:viewcourselist',
        'moodle/course:view',
        'moodle/course:update',
        'moodle/course:viewparticipants',
        'moodle/course:enrolreview'
    ],

    'iinicia_aspirante' => [],

    'iinicia_soporte' => []
];

$comunes = [
    'moodle/user:editownprofile',
    'moodle/user:changeownpassword'
];

foreach ($permisos as $shortname => $capacidades) {

    $DB->get_record(
        'role',
        ['shortname' => $shortname],
        '*',
        MUST_EXIST
    );

    foreach (array_merge($capacidades, $comunes) as $capacidad) {
        if (!$DB->record_exists('capabilities', [
            'name' => $capacidad
        ])) {
            throw new Exception(
                "Capacidad inexistente: $capacidad"
            );
        }
    }
}

$transaccion = $DB->start_delegated_transaction();

foreach ($permisos as $shortname => $capacidades) {

    $rol = $DB->get_record(
        'role',
        ['shortname' => $shortname],
        '*',
        MUST_EXIST
    );

    echo "\n=== $shortname ===\n";

    foreach (array_merge($capacidades, $comunes) as $capacidad) {

        assign_capability(
            $capacidad,
            CAP_ALLOW,
            $rol->id,
            $contexto->id,
            true
        );

        echo "PERMITIDO: $capacidad\n";
    }
}

$transaccion->allow_commit();

echo "\nCONFIGURACION COMPLETADA\n";
