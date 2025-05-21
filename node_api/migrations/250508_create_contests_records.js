exports.up = async (knex) => {
    await knex.schema.createTableIfNotExists('contests_records', (table) => {
        table.increments('id').primary();
        table.string('url', 255).nullable();
        table.text('object').nullable();
        table.integer('contest_id').notNullable();
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('contests_records');
};