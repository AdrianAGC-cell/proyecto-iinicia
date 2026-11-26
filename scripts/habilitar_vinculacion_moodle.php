<?php

define('CLI_SCRIPT', true);
require '/var/www/html/config.php';

$servicio = $DB->get_record(
    'external_services',
    ['shortname' => 'moodle_mobile_app'],
    '*',
    MUST_EXIST
);

$funciones = [
    'core_user_create_users',
    'core_user_get_users_by_field'
];

foreach ($funciones as $nombre) {

    $DB->get_record(
        'external_functions',
        ['name' => $nombre],
        '*',
        MUST_EXIST
    );

    $registro = [
        'externalserviceid' => $servicio->id,
        'functionname' => $nombre
    ];

    if (!$DB->record_exists(
        'external_services_functions',
        $registro
    )) {
        $DB->insert_record(
            'external_services_functions',
            (object) $registro
        );

        echo "HABILITADA: $nombre\n";
    } else {
        echo "YA HABILITADA: $nombre\n";
    }
}

echo "Permisos de usuarios conservados.\n";
echo "Configuracion terminada.\n";
