<?php

defined('MOODLE_INTERNAL') || die();

function xmldb_local_iinicia_upgrade($oldversion) {
    global $DB;

    $dbman = $DB->get_manager();

    if ($oldversion < 2026112503) {

        $table = new xmldb_table('local_iinicia_cancel');

        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null,
            XMLDB_NOTNULL, XMLDB_SEQUENCE);

        $table->add_field('assignid', XMLDB_TYPE_INTEGER, '10', null,
            XMLDB_NOTNULL);

        $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null,
            XMLDB_NOTNULL);

        $table->add_field('submissionid', XMLDB_TYPE_INTEGER, '10', null,
            XMLDB_NOTNULL);

        $table->add_field('attemptnumber', XMLDB_TYPE_INTEGER, '10', null,
            XMLDB_NOTNULL, null, '0');

        $table->add_field('submissionmodified', XMLDB_TYPE_INTEGER, '10',
            null, XMLDB_NOTNULL);

        $table->add_field('status', XMLDB_TYPE_CHAR, '20', null,
            XMLDB_NOTNULL, null, 'pending');

        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null,
            XMLDB_NOTNULL);

        $table->add_field('timemodified', XMLDB_TYPE_INTEGER, '10', null,
            XMLDB_NOTNULL);

        $table->add_field('reviewerid', XMLDB_TYPE_INTEGER, '10');

        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);

        $table->add_index(
            'assignment-user-attempt',
            XMLDB_INDEX_NOTUNIQUE,
            ['assignid', 'userid', 'attemptnumber']
        );

        $table->add_index(
            'assignment-status',
            XMLDB_INDEX_NOTUNIQUE,
            ['assignid', 'status']
        );

        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        upgrade_plugin_savepoint(
            true, 2026112503, 'local', 'iinicia'
        );
    }

    return true;
}
