exports.up = async (knex) => {
    await knex.schema.createTableIfNotExists('category', (table) => {
        table.increments('id').primary();
        table.string('name', 45).notNullable();
        table.integer('mostrar_en_ranking');
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('category');
};