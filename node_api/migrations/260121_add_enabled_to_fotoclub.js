exports.up = async (knex) => {
    await knex.schema.alterTable('fotoclub', (table) => {
        table.boolean('enabled').defaultTo(true);
    });
};

exports.down = async (knex) => {
    await knex.schema.alterTable('fotoclub', (table) => {
        table.dropColumn('enabled');
    });
};