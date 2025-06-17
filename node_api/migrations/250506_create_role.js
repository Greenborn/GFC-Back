exports.up = async (knex) => {
    await knex.schema.createTable('role', (table) => {
        table.increments('id').primary();
        table.string('type', 45).notNullable();
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable('role');
};