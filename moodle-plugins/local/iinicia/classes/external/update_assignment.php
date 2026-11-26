<?php

namespace local_iinicia\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

defined('MOODLE_INTERNAL') || die();

class update_assignment extends external_api {

    public static function execute_parameters() {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT),
            'cmid' => new external_value(PARAM_INT),
            'name' => new external_value(PARAM_TEXT),
            'description' => new external_value(PARAM_TEXT),
            'availablefrom' => new external_value(PARAM_INT),
            'duedate' => new external_value(PARAM_INT),
            'cutoffdate' => new external_value(PARAM_INT),
            'modified' => new external_value(PARAM_INT)
        ]);
    }

    public static function execute(
        $courseid, $cmid, $name, $description,
        $availablefrom, $duedate, $cutoffdate, $modified
    ) {
        global $CFG, $USER, $DB;

        require_once($CFG->dirroot . '/course/modlib.php');
        require_once($CFG->dirroot . '/mod/assign/locallib.php');

        $p = (object) self::validate_parameters(
            self::execute_parameters(),
            compact(
                'courseid', 'cmid', 'name', 'description',
                'availablefrom', 'duedate', 'cutoffdate', 'modified'
            )
        );

        $course = get_course($p->courseid);
        $context = \context_course::instance($course->id);

        self::validate_context($context);
        require_capability('moodle/course:manageactivities', $context);

        if (!is_enrolled($context, $USER, '', true) &&
            !is_siteadmin($USER)) {
            throw new \moodle_exception('nopermissions', 'error');
        }

        $cm = get_coursemodule_from_id(
            'assign', $p->cmid, $course->id, false, MUST_EXIST
        );

        if ((int)$cm->course !== (int)$course->id) {
            throw new \invalid_parameter_exception('Curso incorrecto');
        }

        $ctx = \context_module::instance($cm->id);

        self::validate_context($ctx);
        require_capability('moodle/course:manageactivities', $ctx);

        $p->name = trim($p->name);

        if ($p->name === '' ||
            \core_text::strlen($p->name) > 200 ||
            \core_text::strlen($p->description) > 10000) {
            throw new \invalid_parameter_exception('Texto invalido');
        }

        if ($p->availablefrom < 0 ||
            $p->duedate < 0 ||
            $p->cutoffdate < 0 ||
            ($p->duedate && $p->duedate <= $p->availablefrom) ||
            ($p->cutoffdate && $p->cutoffdate < $p->duedate) ||
            ($p->cutoffdate && $p->cutoffdate < $p->availablefrom)) {
            throw new \invalid_parameter_exception('Fechas invalidas');
        }

        [$cm, $ctx, $module, $data, $section] =
            get_moduleinfo_data($cm, $course);

        if ((int)$data->timemodified !== $p->modified) {
            throw new \invalid_parameter_exception(
                'La asignacion cambio. Vuelve a cargarla.'
            );
        }

        // Evitar sobrescribir instrucciones HTML o archivos incrustados.
        $original = $DB->get_record(
            'assign',
            ['id' => $cm->instance],
            '*',
            MUST_EXIST
        );

        if ((int)$original->introformat !== FORMAT_PLAIN) {
            throw new \invalid_parameter_exception(
                'Esta asignacion requiere edicion desde Moodle.'
            );
        }

        $fs = get_file_storage();

        if ($fs->get_area_files(
            $ctx->id, 'mod_assign', 'intro', 0, 'id', false
        )) {
            throw new \invalid_parameter_exception(
                'La descripcion contiene archivos incrustados.'
            );
        }

        $assignment = new \assign($ctx, $cm, $course);

        $plugins = array_merge(
            $assignment->get_submission_plugins(),
            $assignment->get_feedback_plugins()
        );

        $defaults = (array)$data;

        foreach ($plugins as $plugin) {
            $prefix = $plugin->get_subtype() . '_' . $plugin->get_type();

            // Admitir únicamente complementos conocidos.
            if ($plugin->is_enabled() &&
                !in_array($prefix, [
                    'assignsubmission_file',
                    'assignfeedback_comments'
                ], true)) {
                throw new \invalid_parameter_exception(
                    'Complemento no compatible con esta edicion.'
                );
            }

            $defaults[$prefix . '_enabled'] =
                (int)$plugin->is_enabled();

            $plugin->data_preprocessing($defaults);

            if ($prefix === 'assignsubmission_file' &&
                $plugin->is_enabled()) {
                $defaults[$prefix . '_maxfiles'] =
                    $plugin->get_config('maxfiles');

                $defaults[$prefix . '_maxsizebytes'] =
                    $plugin->get_config('maxsizebytes');

                $defaults[$prefix . '_filetypes'] =
                    $plugin->get_config('filetypes');
            }
        }

        $data = (object)$defaults;

        if (!empty($data->teamsubmission) ||
            !empty($data->blindmarking) ||
            !empty($data->markingworkflow) ||
            !empty($data->gradepenalty)) {
            throw new \invalid_parameter_exception(
                'Configuracion avanzada. Editar desde Moodle.'
            );
        }

        $data->name = $p->name;
        $data->introeditor['text'] = $p->description;
        $data->introeditor['format'] = FORMAT_PLAIN;

        $data->allowsubmissionsfromdate = $p->availablefrom;
        $data->duedate = $p->duedate;
        $data->cutoffdate = $p->cutoffdate;

        $data->completionunlocked = 0;
        $data->enableaitools = $cm->enableaitools ?? 0;
        $data->enabledaiactions = $cm->enabledaiactions ?? null;

        $transaction = $DB->start_delegated_transaction();

        update_moduleinfo($cm, $data, $course);

        $transaction->allow_commit();

        return [
            'success' => true,
            'cmid' => $cm->id,
            'assignid' => $cm->instance
        ];
    }

    public static function execute_returns() {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL),
            'cmid' => new external_value(PARAM_INT),
            'assignid' => new external_value(PARAM_INT)
        ]);
    }
}
