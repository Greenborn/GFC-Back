exports.up = async (knex) => {
  const exists = await knex.schema.hasTable('contest_judge');
  if (!exists) {
    const hasContest = await knex.schema.hasTable('contest');
    const hasUser = await knex.schema.hasTable('user');
    await knex.schema.createTable('contest_judge', (table) => {
      table.increments('id').primary();
      table.integer('contest_id').unsigned().notNullable();
      table.integer('user_id').unsigned().notNullable();
      table.datetime('created_at').notNullable();
      table.unique(['contest_id', 'user_id']);
      if (hasContest) table.foreign('contest_id').references('contest.id').onDelete('CASCADE');
      if (hasUser) table.foreign('user_id').references('user.id').onDelete('CASCADE');
    });
  }
};

exports.down = (knex) =>
  knex.schema.dropTableIfExists('contest_judge');
