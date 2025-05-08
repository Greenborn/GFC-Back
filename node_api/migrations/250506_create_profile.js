exports.up = async (knex) => {
    await knex.schema.createTable('profile', (table) => {
      table.increments('id').primary();
      table.string('name', 59).nullable();
      table.string('last_name', 50).nullable();
      table.integer('fotoclub_id').nullable();
      table.string('img_url', 200).nullable();
      table.boolean('executive').defaultTo(false);
      table.string('executive_rol').nullable();
      table.string('dni', 25).nullable();
    });
  };
  
  exports.down = async (knex) => {
    await knex.schema.dropTable('profile');
  };