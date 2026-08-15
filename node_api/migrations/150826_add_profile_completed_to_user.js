exports.up = async (knex) => {
  const hasColumn = await knex.schema.hasColumn('user', 'profile_completed');
  if (!hasColumn) {
    await knex.schema.alterTable('user', (table) => {
      table.boolean('profile_completed').notNullable().defaultTo(false);
    });
  }
  // Backfill: los usuarios ya existentes se consideran con perfil completo
  await knex('user').whereNull('profile_completed').orWhere('profile_completed', 0).update({ profile_completed: true });
};

exports.down = async (knex) => {
  const hasColumn = await knex.schema.hasColumn('user', 'profile_completed');
  if (hasColumn) {
    await knex.schema.alterTable('user', (table) => {
      table.dropColumn('profile_completed');
    });
  }
};
