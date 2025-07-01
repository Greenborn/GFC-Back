exports.up = async (knex) => {
  await knex.schema.createTableIfNotExists('contest_result', (table) => {
    table.integer('id').notNullable().primary();
    table.integer('metric_id').notNullable();
    table.integer('image_id').notNullable();
    table.integer('contest_id').notNullable();
    table.integer('section_id').notNullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('contest_result');
};