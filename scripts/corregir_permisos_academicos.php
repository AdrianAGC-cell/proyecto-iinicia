<?php

define('CLI_SCRIPT', true);
require '/var/www/html/config.php';

global $DB;

$permisos = [
    'iinicia_academico' => [
        'moodle/course:changefullname',
        'moodle/role:assign'
    ],
    'iinicia_coordinador' => [
        'moodle/course:changefullname'
    ]
];

$contexto = context_system::instance();

foreach ($permisos as $shortname => $capacidades) {

    $rol = $DB->get_record(
        'role',
        ['shortname' => $shortname],
        '*',
        MUST_EXIST
    );

    echo "\n=== $shortname ===\n";

    foreach ($capacidades as $capacidad) {

        assign_capability(
            $capacidad,
            CAP_ALLOW,
            $rol->id,
            $contexto->id,
            true
        );

        echo "PERMISO CONFIGURADO: $capacidad\n";
    }
}

echo "\nCORRECCION COMPLETADA\n";
