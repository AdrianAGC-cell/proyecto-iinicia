<?php

define('CLI_SCRIPT', true);
require '/var/www/html/config.php';

global $DB;

$contexto = context_system::instance();

foreach ([
    'iinicia_academico',
    'iinicia_coordinador'
] as $shortname) {

    $rol = $DB->get_record(
        'role',
        ['shortname' => $shortname],
        '*',
        MUST_EXIST
    );

    assign_capability(
        'moodle/user:viewdetails',
        CAP_ALLOW,
        $rol->id,
        $contexto->id,
        true
    );

    echo "PERMISO CONFIGURADO: $shortname\n";
}

echo "\nCONFIGURACION COMPLETADA\n";
