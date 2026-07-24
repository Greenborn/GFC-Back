exports.up = (knex) =>
  knex.schema.alterTable('contest', (table) => {
    table.boolean('is_judging').defaultTo(false);
  });

exports.down = (knex) =>
  knex.schema.alterTable('contest', (table) => {
    table.dropColumn('is_judging');
  });
