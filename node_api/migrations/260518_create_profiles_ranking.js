exports.up = async (knex) => {
    await knex.schema.createTableIfNotExists('profiles_ranking', (table) => {
        table.integer('id_profile').primary().notNullable();
        table.integer('puntuacion').notNullable().defaultTo(0);
        table.foreign('id_profile').references('profile.id').onDelete('CASCADE');
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('profiles_ranking');
};
