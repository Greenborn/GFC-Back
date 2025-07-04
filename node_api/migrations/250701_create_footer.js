exports.up = async (knex) => {
    await knex.schema.createTableIfNotExists('footer', (table) => {
        table.increments('id').primary();
        table.string('email', 45).nullable();
        table.string('address', 45).nullable();
        table.string('phone', 45).nullable();
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('footer');
}; 