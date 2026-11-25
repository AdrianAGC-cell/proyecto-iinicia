<?php

namespace local_iinicia\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

class request_cancel extends external_api {

    public static function execute_parameters() {
        return new external_function_parameters([
            'assignid' => new external_value(
                PARAM_INT, 'Assignment ID'
            )
        ]);
    }

    public static function execute($assignid) {
        global $CFG, $DB, $USER;

        require_once($CFG->dirroot . '/mod/assign/locallib.php');
        require_once($CFG->libdir . '/gradelib.php');

        $params = self::validate_parameters(
            self::execute_parameters(),
            ['assignid' => $assignid]
        );

        $assignid = $params['assignid'];
        $userid = (int)$USER->id;

        $cm = get_coursemodule_from_instance(
            'assign', $assignid, 0, false, MUST_EXIST
        );

        $context = \context_module::instance($cm->id);

        self::validate_context($context);

        require_capability('mod/assign:submit', $context);

        $rechazar = function($mensaje) {
            return [
                'success' => false,
                'requestid' => 0,
                'status' => 'unavailable',
                'message' => $mensaje
            ];
        };

        if (!is_enrolled(
            $context, $userid, 'mod/assign:submit', true
        )) {
            return $rechazar('Estudiante no inscrito');
        }

        $course = get_course($cm->course);
        $assignment = new \assign($context, $cm, $course);
        $instance = $assignment->get_instance();

        if (
            empty($instance->submissiondrafts) ||
            !empty($instance->teamsubmission) ||
            !empty($instance->blindmarking) ||
            !empty($instance->markingworkflow) ||
            !empty($instance->requiresubmissionstatement) ||
            groups_get_activity_groupmode($cm) != NOGROUPS
        ) {
            return $rechazar('Actividad no compatible');
        }

        $factory = \core\lock\lock_config::get_lock_factory(
            'local_iinicia_cancel'
        );

        $lock = $factory->get_lock(
            $assignid . ':' . $userid, 10
        );

        if (!$lock) {
            return $rechazar('Operacion ocupada. Intenta nuevamente');
        }

        try {

            $submission = $assignment->get_user_submission(
                $userid, false
            );

            if (
                !$submission ||
                $submission->status !== 'submitted'
            ) {
                return $rechazar('No existe una entrega confirmada');
            }

            $grade = $assignment->get_user_grade(
                $userid, false, $submission->attemptnumber
            );

            if ($grade && (float)$grade->grade !== -1.0) {
                return $rechazar('La entrega ya fue calificada');
            }

            $gradinginfo = grade_get_grades(
                $course->id,
                'mod',
                'assign',
                $assignid,
                [$userid]
            );

            $bookgrade = $gradinginfo->items[0]->grades[$userid] ?? null;

            if (!$bookgrade || !property_exists($bookgrade, 'grade')) {
                return $rechazar('No se pudo verificar la calificacion');
            }

            if (
                $bookgrade->grade !== null ||
                !empty($bookgrade->locked) ||
                !empty($bookgrade->overridden)
            ) {
                return $rechazar('Calificacion existente o bloqueada');
            }

            $conditions = [
                'assignid' => $assignid,
                'userid' => $userid,
                'status' => 'pending'
            ];

            $pending = $DB->get_record(
                'local_iinicia_cancel',
                $conditions
            );

            if ($pending) {

                if (
                    (int)$pending->submissionid === (int)$submission->id &&
                    (int)$pending->attemptnumber === (int)$submission->attemptnumber &&
                    (int)$pending->submissionmodified === (int)$submission->timemodified
                ) {
                    return [
                        'success' => true,
                        'requestid' => (int)$pending->id,
                        'status' => 'pending',
                        'message' => 'Ya existe una solicitud pendiente'
                    ];
                }

                $pending->status = 'expired';
                $pending->timemodified = time();

                $DB->update_record(
                    'local_iinicia_cancel', $pending
                );
            }

            $record = (object)[
                'assignid' => $assignid,
                'userid' => $userid,
                'submissionid' => $submission->id,
                'attemptnumber' => $submission->attemptnumber,
                'submissionmodified' => $submission->timemodified,
                'status' => 'pending',
                'timecreated' => time(),
                'timemodified' => time(),
                'reviewerid' => null
            ];

            $id = $DB->insert_record(
                'local_iinicia_cancel', $record
            );

            return [
                'success' => true,
                'requestid' => (int)$id,
                'status' => 'pending',
                'message' => 'Solicitud registrada correctamente'
            ];

        } finally {
            $lock->release();
        }
    }

    public static function execute_returns() {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL, 'Success'),
            'requestid' => new external_value(PARAM_INT, 'Request ID'),
            'status' => new external_value(PARAM_TEXT, 'Status'),
            'message' => new external_value(PARAM_TEXT, 'Message')
        ]);
    }
}
