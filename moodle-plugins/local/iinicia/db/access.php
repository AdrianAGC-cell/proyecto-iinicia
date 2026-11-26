<?php

defined('MOODLE_INTERNAL') || die();

$capabilities = [
    'local/iinicia:exchangeidentity' => [
        'riskbitmask' => RISK_DATALOSS | RISK_PERSONAL,
        'captype' => 'write',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes' => []
    ]
];
