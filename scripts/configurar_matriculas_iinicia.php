<?php

define('CLI_SCRIPT', true);
require '/var/www/html/config.php';

global $DB;

$servicio = $DB->get_record(
    'external_services',
    ['shortname' => 'moodle_mobile_app'],
    '*',
    MUST_EXIST
);

$academico = $DB->get_record(
    'role',
    ['shortname' => 'iinicia_academico'],
    '*',
    MUST_EXIST
);

$estudiante = $DB->get_record(
    'role',
    ['shortname' => 'student'],
    '*',
    MUST_EXIST
);

$funciones = [
    'enrol_manual_enrol_users',
    'core_cohort_get_cohorts',
    'core_cohort_create_cohorts',
    'core_cohort_get_cohort_members',
    'core_cohort_add_cohort_members'
];

$transaccion = $DB->start_delegated_transaction();

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
    }

    echo "DISPONIBLE: $funcion\n";
}

$asignacion = [
    'roleid' => $academico->id,
    'allowassign' => $estudiante->id
];

if (!$DB->record_exists(
    'role_allow_assign',
    $asignacion
)) {
    $DB->insert_record(
        'role_allow_assign',
        (object)$asignacion
    );
}

echo "ROL ASIGNABLE: estudiante\n";

$transaccion->allow_commit();

echo "CONFIGURACION COMPLETADA\n";
