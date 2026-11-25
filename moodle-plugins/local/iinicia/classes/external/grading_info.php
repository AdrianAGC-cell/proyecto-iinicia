<?php

namespace local_iinicia\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

class grading_info extends external_api {

    public static function execute_parameters() {
        return new external_function_parameters([
            'assignid' => new external_value(PARAM_INT, 'Assignment ID'),
            'userid' => new external_value(PARAM_INT, 'Student ID')
        ]);
    }

    public static function execute($assignid, $userid) {
        global $CFG;

        require_once($CFG->dirroot . '/mod/assign/locallib.php');
        require_once($CFG->dirroot . '/grade/grading/lib.php');

        $params = self::validate_parameters(
            self::execute_parameters(),
            ['assignid' => $assignid, 'userid' => $userid]
        );

        $assignid = $params['assignid'];
        $userid = $params['userid'];

        $cm = get_coursemodule_from_instance(
            'assign', $assignid, 0, false, MUST_EXIST
        );

        $context = \context_module::instance($cm->id);

        self::validate_context($context);

        require_capability('mod/assign:grade', $context);

        $course = get_course($cm->course);

        $assignment = new \assign($context, $cm, $course);

        $instance = $assignment->get_instance();

        $manager = get_grading_manager(
            $context, 'mod_assign', 'submissions'
        );

        $method = $manager->get_active_method();

        $submission = $assignment->get_user_submission(
            $userid, false
        );

        $enrolled = is_enrolled(
            $context, $userid, 'mod/assign:submit', true
        );

        $compatible =
            $enrolled &&
            empty($method) &&
            $instance->grade > 0 &&
            empty($instance->teamsubmission) &&
            empty($instance->blindmarking) &&
            empty($instance->markingworkflow) &&
            groups_get_activity_groupmode($cm) == NOGROUPS;

        $blocked = !$compatible ||
            $assignment->grading_disabled($userid);

        return [
            'courseid' => (int)$course->id,
            'assignid' => (int)$assignid,
            'compatible' => $compatible,
            'blocked' => $blocked,
            'maxgrade' => (float)$instance->grade,
            'method' => $method ?: 'simple',
            'submitted' => $compatible && $submission &&
                $submission->status === 'submitted',
            'attempt' => $compatible && $submission
                ? (int)$submission->attemptnumber : -1
        ];
    }

    public static function execute_returns() {
        return new external_single_structure([
            'courseid' => new external_value(PARAM_INT, 'Course ID'),
            'assignid' => new external_value(PARAM_INT, 'Assignment ID'),
            'compatible' => new external_value(PARAM_BOOL, 'Supported'),
            'blocked' => new external_value(PARAM_BOOL, 'Blocked'),
            'maxgrade' => new external_value(PARAM_FLOAT, 'Maximum grade'),
            'method' => new external_value(PARAM_TEXT, 'Grading method'),
            'submitted' => new external_value(PARAM_BOOL, 'Submitted'),
            'attempt' => new external_value(PARAM_INT, 'Attempt')
        ]);
    }
}
