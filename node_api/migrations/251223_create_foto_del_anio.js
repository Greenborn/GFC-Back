exports.up = function(knex) {
  return knex.schema.createTable('foto_del_anio', function(table) {
    table.increments('id').primary();
    table.integer('id_foto').notNullable();
    table.string('puesto', 255).notNullable();
    table.integer('orden').notNullable();
    table.integer('temporada').notNullable();
    table.string('nombre_obra', 255).notNullable();
    table.string('nombre_autor', 255).notNullable();
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('foto_del_anio');
};
