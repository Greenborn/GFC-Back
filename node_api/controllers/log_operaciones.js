

async function registrarLogOperacion(idUsuario, evento, metaData, dateTime) {
  const logOperacion = {
    id_usuario: idUsuario,
    evento,
    meta_data: metaData,
    date_time: dateTime,
  };

  try {
    await global.knex('log_operaciones').insert(logOperacion)
  } catch (error) {
    console.error('Error al registrar log de operación:', error)
  }
}

module.exports = registrarLogOperacion