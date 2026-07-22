exports.up = (knex) =>
  knex.schema.alterTable('user', (table) => {
    table.boolean('is_test_enabled').defaultTo(false);
  });

exports.down = (knex) =>
  knex.schema.alterTable('user', (table) => {
    table.dropColumn('is_test_enabled');
  });
