exports.up = async (knex) => {
    await knex.schema.createTableIfNotExists('image', (table) => {
        table.increments('id').primary();
        table.string('code', 20).notNullable();
        table.string('title', 45).notNullable();
        table.integer('profile_id').notNullable();
        table.string('url', 45).nullable();
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('image');
}; 