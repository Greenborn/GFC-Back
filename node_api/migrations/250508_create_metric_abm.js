exports.up = async (knex) => {
    await knex.schema.createTableIfNotExists('metric_abm', (table) => {
        table.increments('id').primary();
        table.string('prize').notNullable();
        table.decimal('score');
        table.string('organization_type', 36);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('metric_abm');
};