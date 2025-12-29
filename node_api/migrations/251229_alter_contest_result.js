exports.up = async (knex) => {
    await knex.schema.alterTable('contest_result', (table) => {
        // Agregar campo type (string, nullable)
        table.string('type').nullable();
        
        // Agregar campo temporada (nullable)
        table.integer('temporada').nullable();
        
        // Modificar contest_id para que sea nullable
        table.integer('contest_id').nullable().alter();
    });
};

exports.down = async (knex) => {
    await knex.schema.alterTable('contest_result', (table) => {
        // Eliminar campo type
        table.dropColumn('type');
        
        // Eliminar campo temporada
        table.dropColumn('temporada');
        
        // Restaurar contest_id como NOT NULL
        table.integer('contest_id').notNullable().alter();
    });
};
