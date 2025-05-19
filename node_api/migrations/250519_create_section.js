exports.up = async (knex) => {
  await knex.schema.createTableIfNotExists('section', (table) => {
    table.increments('id').primary();
    table.string('name', 45).notNullable();
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('section');
};
