exports.up = async (knex) => {
    await knex.schema.createTableIfNotExists('contest_section', (table) => {
        table.increments('id').primary();
        table.integer('contest_id').notNullable();
        table.integer('section_id').notNullable();
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('contest_section');
};