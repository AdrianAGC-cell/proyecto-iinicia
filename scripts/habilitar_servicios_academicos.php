<?php

define('CLI_SCRIPT', true);

require '/var/www/html/config.php';
require_once($CFG->libdir . '/externallib.php');

global $DB;

$servicio = $DB->get_record(
    'external_services',
    ['shortname' => 'moodle_mobile_app'],
    '*',
    MUST_EXIST
);

$funciones = [
    'core_course_create_courses',
    'core_course_update_courses'
];

foreach ($funciones as $funcion) {

    $DB->get_record(
        'external_functions',
        ['name' => $funcion],
        '*',
        MUST_EXIST
    );

    $registro = [
        'externalserviceid' => $servicio->id,
        'functionname' => $funcion
    ];

    if (!$DB->record_exists(
        'external_services_functions',
        $registro
    )) {
        $DB->insert_record(
            'external_services_functions',
            (object)$registro
        );

        echo "HABILITADA: $funcion\n";
    } else {
        echo "YA HABILITADA: $funcion\n";
    }
}

echo "CONFIGURACION COMPLETADA\n";
