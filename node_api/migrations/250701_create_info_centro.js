exports.up = async (knex) => {
    await knex.schema.createTableIfNotExists('info_centro', (table) => {
        table.increments('id').primary();
        table.string('title', 200).nullable();
        table.text('content').nullable();
        table.string('img_url', 45).nullable();
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('info_centro');
}; 