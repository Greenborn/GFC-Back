exports.up = async (knex) => {
  await knex.schema.createTableIfNotExists('contest_category', (table) => {
    table.increments('id').primary();
    table.integer('contest_id').notNullable();
    table.integer('category_id').notNullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('contest_category');
};