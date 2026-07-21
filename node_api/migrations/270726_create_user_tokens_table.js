exports.up = (knex) =>
  knex.schema.createTable('user_tokens', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable();
    table.index('user_id');
    table.string('token', 128).notNullable().unique().index();
    table.datetime('created_at').notNullable();
    table.datetime('expires_at').nullable();
    table.datetime('last_used_at').nullable();
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();
    table.boolean('is_active').defaultTo(true);
  });

exports.down = (knex) =>
  knex.schema.dropTableIfExists('user_tokens');
