exports.up = async (knex) => {
  const exists = await knex.schema.hasTable('contest_puntuacion_vote');
  if (!exists) {
    const hasContest = await knex.schema.hasTable('contest');
    const hasImage = await knex.schema.hasTable('image');
    const hasUser = await knex.schema.hasTable('user');
    const hasMetricAbm = await knex.schema.hasTable('metric_abm');
    await knex.schema.createTable('contest_puntuacion_vote', (table) => {
      table.increments('id').primary();
      table.integer('contest_id').unsigned().notNullable();
      table.integer('image_id').unsigned().notNullable();
      table.integer('user_id').unsigned().notNullable();
      table.integer('metric_abm_id').unsigned().notNullable();
      table.datetime('created_at').notNullable();
      table.datetime('updated_at').notNullable();
      table.unique(['contest_id', 'image_id', 'user_id']);
      if (hasContest) table.foreign('contest_id').references('contest.id').onDelete('CASCADE');
      if (hasImage) table.foreign('image_id').references('image.id').onDelete('CASCADE');
      if (hasUser) table.foreign('user_id').references('user.id').onDelete('CASCADE');
      if (hasMetricAbm) table.foreign('metric_abm_id').references('metric_abm.id').onDelete('CASCADE');
    });
  }
};

exports.down = (knex) =>
  knex.schema.dropTableIfExists('contest_puntuacion_vote');
