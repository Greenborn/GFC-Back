exports.up = async (knex) => {
    await knex.schema.createTableIfNotExists('thumbnail_type', (table) => {
        table.increments('id').primary();
        table.integer('width').notNullable();
        table.integer('height').notNullable();
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('thumbnail_type');
}; 