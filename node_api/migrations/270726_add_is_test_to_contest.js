exports.up = (knex) =>
  knex.schema.alterTable('contest', (table) => {
    table.boolean('is_test').defaultTo(false);
  });

exports.down = (knex) =>
  knex.schema.alterTable('contest', (table) => {
    table.dropColumn('is_test');
  });
