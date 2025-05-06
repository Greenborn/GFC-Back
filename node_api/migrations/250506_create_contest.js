exports.up = async (knex) => {
    await knex.schema.createTable('contest', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.text('description').nullable();
        table.timestamp('start_date').nullable();
        table.timestamp('end_date').nullable();
        table.integer('max_img_section').nullable().defaultTo(3);
        table.string('img_url', 200).nullable();
        table.string('rules_url').nullable();
        table.string('sub_title', 255).nullable();
        table.string('organization_type', 250).nullable();
        table.boolean('judged').nullable();
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTable('contest');
};