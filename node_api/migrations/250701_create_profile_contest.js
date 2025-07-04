exports.up = async (knex) => {
    await knex.schema.createTableIfNotExists('profile_contest', (table) => {
        table.increments('id').primary();
        table.integer('profile_id').notNullable();
        table.integer('contest_id').notNullable();
        table.integer('category_id').notNullable();
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('profile_contest');
}; 