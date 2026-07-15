exports.up = async (knex) => {
    await knex.schema.alterTable('image', (table) => {
        table.integer('width').nullable();
        table.integer('height').nullable();
        table.string('mime_type', 50).nullable();
        table.jsonb('image_metadata').nullable();
    });
};

exports.down = async (knex) => {
    await knex.schema.alterTable('image', (table) => {
        table.dropColumn('width');
        table.dropColumn('height');
        table.dropColumn('mime_type');
        table.dropColumn('image_metadata');
    });
};
