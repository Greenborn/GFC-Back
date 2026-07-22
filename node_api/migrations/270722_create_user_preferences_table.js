exports.up = (knex) =>
  knex.schema.createTable('user_preferences', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.index('user_id');
    table.string('key', 100).notNullable();
    table.text('value').nullable();
    table.datetime('created_at').notNullable();
    table.datetime('updated_at').notNullable();
    table.unique(['user_id', 'key']);
  });

exports.down = (knex) =>
  knex.schema.dropTableIfExists('user_preferences');
