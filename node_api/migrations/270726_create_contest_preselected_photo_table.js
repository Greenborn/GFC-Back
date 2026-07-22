exports.up = async (knex) => {
  const exists = await knex.schema.hasTable('contest_preselected_photo');
  if (!exists) {
    const hasContest = await knex.schema.hasTable('contest');
    const hasImage = await knex.schema.hasTable('image');
    await knex.schema.createTable('contest_preselected_photo', (table) => {
      table.increments('id').primary();
      table.integer('contest_id').unsigned().notNullable();
      table.integer('image_id').unsigned().notNullable();
      table.boolean('preselected').defaultTo(false);
      table.json('votes').nullable();
      table.unique(['contest_id', 'image_id']);
      if (hasContest) table.foreign('contest_id').references('contest.id').onDelete('CASCADE');
      if (hasImage) table.foreign('image_id').references('image.id').onDelete('CASCADE');
    });
  }
};

exports.down = (knex) =>
  knex.schema.dropTableIfExists('contest_preselected_photo');
