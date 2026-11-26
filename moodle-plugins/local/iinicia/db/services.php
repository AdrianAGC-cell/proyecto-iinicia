<?php

defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_iinicia_grading_info' => [
        'classname' => 'local_iinicia\external\grading_info',
        'methodname' => 'execute',
        'description' => 'Checks assignment grading compatibility',
        'type' => 'read',
        'capabilities' => 'mod/assign:grade',
        'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
    ]
];

$functions['local_iinicia_assignment_permissions'] = [
    'classname' => 'local_iinicia\external\assignment_permissions',
    'methodname' => 'execute',
    'description' => 'Returns current user assignment permissions',
    'type' => 'read',
    'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
];

$functions['local_iinicia_request_cancel'] = [
    'classname' => 'local_iinicia\external\request_cancel',
    'methodname' => 'execute',
    'description' => 'Requests cancellation of an assignment submission',
    'type' => 'write',
    'capabilities' => 'mod/assign:submit',
    'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
];

$functions['local_iinicia_request_cancel'] = [
    'classname' => 'local_iinicia\external\request_cancel',
    'methodname' => 'execute',
    'description' => 'Requests cancellation of an assignment submission',
    'type' => 'write',
    'capabilities' => 'mod/assign:submit',
    'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
];

$functions['local_iinicia_cancel_status'] = [
    'classname' => 'local_iinicia\external\cancel_status',
    'methodname' => 'execute',
    'description' => 'Returns assignment cancellation requests',
    'type' => 'read',
    'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
];

$functions['local_iinicia_review_cancel'] = [
    'classname' => 'local_iinicia\external\review_cancel',
    'methodname' => 'execute',
    'description' => 'Approves or rejects cancellation requests',
    'type' => 'write',
    'capabilities' => 'mod/assign:grade',
    'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
];

$functions['local_iinicia_user_roles'] = [
    'classname' => 'local_iinicia\external\user_roles',
    'methodname' => 'execute',
    'description' => 'Returns current authenticated user role assignments',
    'type' => 'read',
    'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
];


$functions['local_iinicia_enrolment_status'] = [
    'classname' => 'local_iinicia\\external\\enrolment_status',
    'methodname' => 'execute',
    'description' => 'Verificar matricula academica activa',
    'type' => 'read',
    'ajax' => false,
    'capabilities' => 'enrol/manual:enrol',
    'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
];


$functions['local_iinicia_create_assignment'] = [
    'classname' => 'local_iinicia\external\create_assignment',
    'methodname' => 'execute',
    'description' => 'Crear asignaciones individuales IINICIA',
    'type' => 'write',
    'ajax' => false,
    'capabilities' => 'moodle/course:manageactivities,mod/assign:addinstance',
    'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
];


$functions['local_iinicia_manage_visibility'] = [
    'classname' => 'local_iinicia\external\manage_visibility',
    'methodname' => 'execute',
    'description' => 'Gestion docente IINICIA: manage_visibility',
    'type' => 'write',
    'ajax' => false,
    'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
];


$functions['local_iinicia_course_permissions'] = [
    'classname' => 'local_iinicia\external\course_permissions',
    'methodname' => 'execute',
    'description' => 'Gestion docente IINICIA: course_permissions',
    'type' => 'read',
    'ajax' => false,
    'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
];


$functions['local_iinicia_assignment_settings'] = [
    'classname' => 'local_iinicia\external\assignment_settings',
    'methodname' => 'execute',
    'description' => 'Edicion docente IINICIA: assignment_settings',
    'type' => 'read',
    'ajax' => false,
    'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
];


$functions['local_iinicia_update_assignment'] = [
    'classname' => 'local_iinicia\external\update_assignment',
    'methodname' => 'execute',
    'description' => 'Edicion docente IINICIA: update_assignment',
    'type' => 'write',
    'ajax' => false,
    'services' => [MOODLE_OFFICIAL_MOBILE_SERVICE]
];


$functions['local_iinicia_exchange_identity'] = [
    'classname' => 'local_iinicia\external\exchange_identity',
    'methodname' => 'execute',
    'description' => 'Exchange institutional identity',
    'type' => 'write',
    'ajax' => false,
    'capabilities' => 'local/iinicia:exchangeidentity'
];


$functions['local_iinicia_revoke_identity'] = [
    'classname' => 'local_iinicia\external\revoke_identity',
    'methodname' => 'execute',
    'description' => 'Revoke institutional session',
    'type' => 'write',
    'ajax' => false,
    'capabilities' => 'local/iinicia:exchangeidentity'
];

$services['IINICIA Identity Bridge'] = [
    'functions' => [
        'local_iinicia_exchange_identity',
        'local_iinicia_revoke_identity'
    ],
    'restrictedusers' => 1,
    'enabled' => 1,
    'shortname' => 'iinicia_identity_bridge',
    'requiredcapability' => 'local/iinicia:exchangeidentity',
    'downloadfiles' => 0,
    'uploadfiles' => 0
];
