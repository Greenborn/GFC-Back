exports.up = async (knex) => {
    await knex.schema.createTableIfNotExists('thumbnail', (table) => {
        table.increments('id').primary();
        table.integer('image_id').notNullable();
        table.integer('thumbnail_type').notNullable();
        table.string('url', 250).notNullable();
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('thumbnail');
}; 