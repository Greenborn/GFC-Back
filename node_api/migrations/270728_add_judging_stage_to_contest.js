exports.up = (knex) =>
  knex.schema.alterTable('contest', (table) => {
    table.string('judging_stage').nullable();
  });

exports.down = (knex) =>
  knex.schema.alterTable('contest', (table) => {
    table.dropColumn('judging_stage');
  });
