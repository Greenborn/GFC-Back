exports.up = (knex) =>
  knex.schema.alterTable('contest_result', (table) => {
    table.integer('position').nullable();
  });

exports.down = (knex) =>
  knex.schema.alterTable('contest_result', (table) => {
    table.dropColumn('position');
  });
