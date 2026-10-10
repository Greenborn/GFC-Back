exports.up = (knex) =>
  knex.schema.alterTable('contest', (table) => {
    table.string('scoring_mode').notNullable().defaultTo('TRADICIONAL');
  });

exports.down = (knex) =>
  knex.schema.alterTable('contest', (table) => {
    table.dropColumn('scoring_mode');
  });
