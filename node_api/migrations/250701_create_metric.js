exports.up = async (knex) => {
    await knex.schema.createTableIfNotExists('metric', (table) => {
        table.increments('id').primary();
        table.string('prize', 10).notNullable();
        table.integer('score').nullable();
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('metric');
}; 