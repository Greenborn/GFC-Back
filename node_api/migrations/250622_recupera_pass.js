exports.up = async (knex) => {
  await knex.schema.table('user', (table) => {
    table.timestamp('pass_recovery_date');
  });
};

exports.down = async (knex) => {
  await knex.schema.table('user', (table) => {
    table.dropColumn('pass_recovery_date');
  });
};