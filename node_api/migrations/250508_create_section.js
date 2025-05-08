exports.up = async (knex) => {
    await knex.schema.createTableIfNotExists('fotoclub', (table) => {
        table.increments('id').primary();
        table.string('name', 45).notNullable();
        table.string('facebook');
        table.string('instagram');
        table.string('email');
        table.string('description');
        table.string('photo_url');
        table.integer('mostrar_en_ranking');
        table.string('organization_type', 250);
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('fotoclub');
};