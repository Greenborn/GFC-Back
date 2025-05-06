exports.up = async (knex) => {
    await knex.schema.createTableIfNotExists('user', (table) => {
        table.increments('id').primary();
        table.string('username', 45).nullable();
        table.string('password_hash', 255).nullable();
        table.string('password_reset_token', 255).nullable();
        table.string('access_token', 128).nullable();
        table.string('created_at', 45).nullable();
        table.string('updated_at', 45).nullable();
        table.integer('status').notNullable();
        table.integer('role_id').notNullable();
        table.integer('profile_id').notNullable();
        table.string('email', 255).nullable();
        table.string('sign_up_verif_code', 255).nullable();
        table.string('sign_up_verif_token', 255).nullable();
        table.string('dni', 25).nullable();
    });
};

exports.down = async (knex) => {
    await knex.schema.dropTableIfExists('user');
};