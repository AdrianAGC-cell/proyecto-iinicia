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
