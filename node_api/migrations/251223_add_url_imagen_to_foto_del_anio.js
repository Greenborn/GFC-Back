exports.up = function(knex) {
  return knex.schema.alterTable('foto_del_anio', function(table) {
    table.string('url_imagen', 255).notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('foto_del_anio', function(table) {
    table.dropColumn('url_imagen');
  });
};
