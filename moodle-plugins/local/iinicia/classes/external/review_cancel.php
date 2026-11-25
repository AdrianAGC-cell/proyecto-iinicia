<?php

namespace local_iinicia\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

class review_cancel extends external_api {

    public static function execute_parameters() {
        return new external_function_parameters([
            'assignid' => new external_value(
                PARAM_INT, 'Assignment ID'
            ),
            'requestid' => new external_value(
                PARAM_INT, 'Request ID'
            ),
            'approve' => new external_value(
                PARAM_BOOL, 'Approve cancellation'
            )
        ]);
    }

    public static function execute(
        $assignid, $requestid, $approve
    ) {
        global $CFG, $DB, $USER;

        require_once($CFG->dirroot . '/mod/assign/locallib.php');
        require_once($CFG->libdir . '/gradelib.php');

        $params = self::validate_parameters(
            self::execute_parameters(),
            [
                'assignid' => $assignid,
                'requestid' => $requestid,
                'approve' => $approve
            ]
        );

        $assignid = $params['assignid'];
        $requestid = $params['requestid'];
        $approve = $params['approve'];

        $cm = get_coursemodule_from_instance(
            'assign', $assignid, 0, false, MUST_EXIST
        );

        $context = \context_module::instance($cm->id);

        self::validate_context($context);

        require_capability('mod/assign:grade', $context);

        $responder = function($success, $status, $message) {
            return [
                'success' => $success,
                'status' => $status,
                'message' => $message
            ];
        };

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
            return $responder(
                false, 'unavailable', 'Actividad no compatible'
            );
        }

        $request = $DB->get_record(
            'local_iinicia_cancel',
            [
                'id' => $requestid,
                'assignid' => $assignid
            ],
            '*',
            MUST_EXIST
        );

        $userid = (int)$request->userid;

        $factory = \core\lock\lock_config::get_lock_factory(
            'local_iinicia_cancel'
        );

        $lock = $factory->get_lock(
            $assignid . ':' . $userid, 10
        );

        if (!$lock) {
            return $responder(
                false, 'busy', 'Operacion ocupada'
            );
        }

        try {

            $request = $DB->get_record(
                'local_iinicia_cancel',
                [
                    'id' => $requestid,
                    'assignid' => $assignid
                ],
                '*',
                MUST_EXIST
            );

            if ($request->status !== 'pending') {
                return $responder(
                    false,
                    $request->status,
                    'La solicitud ya fue procesada'
                );
            }

            $actualizar = function($status) use (
                $DB, $USER, $request
            ) {
                $request->status = $status;
                $request->reviewerid = $USER->id;
                $request->timemodified = time();

                $DB->update_record(
                    'local_iinicia_cancel', $request
                );
            };

            if (!$approve) {

                $actualizar('rejected');

                return $responder(
                    true,
                    'rejected',
                    'Solicitud rechazada correctamente'
                );
            }

            if (!is_enrolled(
                $context, $userid, 'mod/assign:submit', true
            )) {
                $actualizar('expired');

                return $responder(
                    false, 'expired', 'Estudiante no inscrito'
                );
            }

            $submission = $assignment->get_user_submission(
                $userid, false
            );

            if (
                !$submission ||
                $submission->status !== 'submitted' ||
                (int)$submission->id !==
                    (int)$request->submissionid ||
                (int)$submission->attemptnumber !==
                    (int)$request->attemptnumber ||
                (int)$submission->timemodified !==
                    (int)$request->submissionmodified
            ) {
                $actualizar('expired');

                return $responder(
                    false, 'expired', 'La entrega original cambio'
                );
            }

            $grade = $assignment->get_user_grade(
                $userid,
                false,
                $submission->attemptnumber
            );

            if ($grade && (float)$grade->grade !== -1.0) {

                $actualizar('expired');

                return $responder(
                    false, 'expired', 'La entrega ya fue calificada'
                );
            }

            $gradinginfo = grade_get_grades(
                $course->id,
                'mod',
                'assign',
                $assignid,
                [$userid]
            );

            $bookgrade =
                $gradinginfo->items[0]->grades[$userid] ?? null;

            if (
                !$bookgrade ||
                !property_exists($bookgrade, 'grade')
            ) {
                return $responder(
                    false,
                    'pending',
                    'No se pudo verificar la calificacion'
                );
            }

            if (
                $bookgrade->grade !== null ||
                !empty($bookgrade->locked) ||
                !empty($bookgrade->overridden)
            ) {
                $actualizar('expired');

                return $responder(
                    false,
                    'expired',
                    'Calificacion existente o bloqueada'
                );
            }

            $obtenerarchivos = function($submissionid) use (
                $context
            ) {
                $fs = get_file_storage();

                $files = $fs->get_area_files(
                    $context->id,
                    'assignsubmission_file',
                    'submission_files',
                    $submissionid,
                    'filepath, filename',
                    false
                );

                $result = [];

                foreach ($files as $file) {
                    $result[] = [
                        $file->get_filepath(),
                        $file->get_filename(),
                        $file->get_filesize(),
                        $file->get_contenthash()
                    ];
                }

                return $result;
            };

            $antes = $obtenerarchivos($submission->id);

            if (empty($antes)) {
                return $responder(
                    false, 'pending', 'No existen archivos'
                );
            }

            $transaction = $DB->start_delegated_transaction();

            try {

                if (!$assignment->revert_to_draft($userid)) {
                    throw new \RuntimeException(
                        'Moodle no pudo regresar a borrador'
                    );
                }

                $updated = $assignment->get_user_submission(
                    $userid, false
                );

                if (
                    !$updated ||
                    $updated->status !== 'draft' ||
                    (int)$updated->id !== (int)$submission->id ||
                    $antes !== $obtenerarchivos($updated->id)
                ) {
                    throw new \RuntimeException(
                        'No se pudo verificar la conservacion de archivos'
                    );
                }

                $actualizar('approved');

                $transaction->allow_commit();

            } catch (\Throwable $error) {

                $transaction->rollback($error);
            }

            return $responder(
                true,
                'approved',
                'Cancelacion autorizada. Archivos conservados'
            );

        } finally {
            $lock->release();
        }
    }

    public static function execute_returns() {
        return new external_single_structure([
            'success' => new external_value(
                PARAM_BOOL, 'Success'
            ),
            'status' => new external_value(
                PARAM_TEXT, 'Status'
            ),
            'message' => new external_value(
                PARAM_TEXT, 'Message'
            )
        ]);
    }
}
