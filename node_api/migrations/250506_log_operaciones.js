exports.up = async (knex) => {
    await knex.schema.createTableIfNotExists('log_operaciones', (table) => {
        table.increments('id').primary();
        table.integer('id_usuario').notNullable();
        table.string('evento', 255).notNullable();
        table.json('meta_data').nullable();
        table.datetime('date_time').notNullable();
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('user');
};