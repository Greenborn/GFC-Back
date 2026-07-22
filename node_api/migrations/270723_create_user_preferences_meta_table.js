exports.up = (knex) =>
  knex.schema.createTable('user_preferences_meta', (table) => {
    table.increments('id').primary();
    table.string('key', 100).notNullable().unique().index();
    table.text('description').nullable();
    table.string('value_type', 50).nullable();
    table.datetime('created_at').notNullable();
  });

exports.down = (knex) =>
  knex.schema.dropTableIfExists('user_preferences_meta');
