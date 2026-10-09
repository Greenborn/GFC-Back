exports.up = async (knex) => {
  const exists = await knex.schema.hasTable('contest_authorized_participant');
  if (!exists) {
    const hasContest = await knex.schema.hasTable('contest');
    await knex.schema.createTable('contest_authorized_participant', (table) => {
      table.increments('id').primary();
      table.integer('contest_id').unsigned().notNullable();
      table.string('last_name', 255).nullable();
      table.string('first_name', 255).nullable();
      table.string('dni', 25).notNullable();
      table.string('dni_normalized', 25).notNullable();
      table.string('birth_date', 30).nullable();
      table.string('faculty', 255).nullable();
      table.string('discipline', 255).nullable();
      table.datetime('created_at').notNullable();
      table.unique(['contest_id', 'dni_normalized']);
      table.index(['contest_id', 'dni_normalized'], 'idx_cap_contest_dni');
      if (hasContest) table.foreign('contest_id').references('contest.id').onDelete('CASCADE');
    });
  }
};

exports.down = (knex) =>
  knex.schema.dropTableIfExists('contest_authorized_participant');
