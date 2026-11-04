exports.up = async (knex) => {
  const exists = await knex.schema.hasTable('log_operaciones');
  if (exists) return;

  await knex.schema.createTable('log_operaciones', (table) => {
    table.increments('id').primary();
    table.integer('id_usuario').unsigned().notNullable();
    table.index('id_usuario');
    table.string('evento', 255).notNullable();
    table.jsonb('meta_data').nullable();
    table.datetime('date_time').notNullable();
    table.index('date_time');
  });
};

exports.down = (knex) =>
  knex.schema.dropTableIfExists('log_operaciones');
