exports.up = (knex) =>
  knex.schema.alterTable('contest', (table) => {
    table.datetime('deleted_at').nullable().defaultTo(null);
  });

exports.down = (knex) =>
  knex.schema.alterTable('contest', (table) => {
    table.dropColumn('deleted_at');
  });
