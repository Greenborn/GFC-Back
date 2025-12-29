const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection.js');
const LogOperacion = require('../controllers/log_operaciones.js');

// GET /contest-record - Listar registros de contests_records
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Log de operación
    await LogOperacion(
      req.user.id,
      `Consulta de contest_records - ${req.user.username}`,
      null,
      new Date()
    );

    // Parámetros de consulta
    const { page = 1, 'per-page': perPage = 20, sort } = req.query;
    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(perPage);
    const offset = (currentPage - 1) * itemsPerPage;

    // Filtros opcionales
    let contestId = req.query['filter[contest_id]'];
    if (!contestId && req.query.filter && typeof req.query.filter === 'object') {
      contestId = req.query.filter.contest_id;
    }

    // Query base
    let query = global.knex('contests_records').select('*');

    // Aplicar filtro por contest_id si existe
    if (contestId) {
      query = query.where('contest_id', contestId);
    }

    // Aplicar ordenamiento
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortDirection = sort.startsWith('-') ? 'desc' : 'asc';
      query = query.orderBy(sortField, sortDirection);
    } else {
      query = query.orderBy('id', 'desc');
    }

    // Obtener total de registros
    const totalCountQuery = global.knex('contests_records').count('id as count');
    if (contestId) {
      totalCountQuery.where('contest_id', contestId);
    }
    const totalCountResult = await totalCountQuery.first();
    const totalCount = parseInt(totalCountResult.count);
    const pageCount = Math.ceil(totalCount / itemsPerPage);

    // Aplicar paginación
    query = query.limit(itemsPerPage).offset(offset);

    // Ejecutar query
    const items = await query;

    res.json({
      items,
      _meta: {
        totalCount,
        pageCount,
        currentPage,
        perPage: itemsPerPage
      }
    });
  } catch (error) {
    console.error('Error en GET /contest-record:', error);
    res.status(500).json({ message: 'Error al obtener registros', error: error.message });
  }
});

// GET /contest-record/:id - Obtener un registro específico
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    // Log de operación
    await LogOperacion(
      req.user.id,
      `Consulta de contest_record ID ${id} - ${req.user.username}`,
      null,
      new Date()
    );

    // Buscar registro
    const record = await global.knex('contests_records')
      .where('id', id)
      .first();

    if (!record) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    res.json(record);
  } catch (error) {
    console.error(`Error en GET /contest-record/${req.params.id}:`, error);
    res.status(500).json({ message: 'Error al obtener registro', error: error.message });
  }
});

// POST /contest-record - Crear nuevo registro
router.post('/', authMiddleware, writeProtection, async (req, res) => {
  try {
    // Solo administradores pueden crear registros
    if (req.user.role_id != '1') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado: solo administradores pueden crear registros' 
      });
    }

    // Validar campos requeridos
    const { contest_id, url, object, type, temporada } = req.body;

    if (!contest_id) {
      return res.status(400).json({ message: 'El campo contest_id es requerido' });
    }

    // Validar que contest_id sea un número
    if (isNaN(parseInt(contest_id))) {
      return res.status(400).json({ message: 'El campo contest_id debe ser un número' });
    }

    // Verificar que el concurso existe
    const contestExists = await global.knex('contest')
      .where('id', contest_id)
      .first();

    if (!contestExists) {
      return res.status(404).json({ message: 'El concurso especificado no existe' });
    }

    // Preparar datos para inserción
    const data = {
      contest_id: parseInt(contest_id),
      url: url || null,
      object: object || null,
      type: type || 'CONCURSO',
      temporada: temporada || new Date().getFullYear()
    };


    // Insertar registro y obtener el ID de forma compatible
    let newId;
    if (global.knex.client && global.knex.client.config && global.knex.client.config.client === 'pg') {
      // PostgreSQL
      const inserted = await global.knex('contests_records').insert(data).returning('id');
      newId = Array.isArray(inserted) ? (inserted[0]?.id || inserted[0]) : inserted;
    } else {
      // MySQL, SQLite, etc.
      newId = await global.knex('contests_records').insert(data);
      if (Array.isArray(newId)) newId = newId[0];
    }

    // Obtener el registro creado
    const newRecord = await global.knex('contests_records')
      .where('id', newId)
      .first();

    // Log de operación
    await LogOperacion(
      req.user.id,
      `Creación de contest_record - ${req.user.username}`,
      JSON.stringify({ id: newId, contest_id }),
      new Date()
    );

    res.status(201).json({
      success: true,
      message: 'Registro creado exitosamente',
      data: newRecord
    });
  } catch (error) {
    console.error('Error en POST /contest-record:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al crear registro', 
      error: error.message 
    });
  }
});

// PUT /contest-record/:id - Actualizar registro completo
router.put('/:id', authMiddleware, writeProtection, async (req, res) => {
  try {
    // Solo administradores pueden actualizar registros
    if (req.user.role_id != '1') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado: solo administradores pueden actualizar registros' 
      });
    }

    const { id } = req.params;
    const { contest_id, url, object } = req.body;

    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    // Validar campos requeridos
    if (!contest_id) {
      return res.status(400).json({ message: 'El campo contest_id es requerido' });
    }

    // Validar que contest_id sea un número
    if (isNaN(parseInt(contest_id))) {
      return res.status(400).json({ message: 'El campo contest_id debe ser un número' });
    }

    // Verificar que el registro existe
    const recordExists = await global.knex('contests_records')
      .where('id', id)
      .first();

    if (!recordExists) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    // Verificar que el concurso existe
    const contestExists = await global.knex('contest')
      .where('id', contest_id)
      .first();

    if (!contestExists) {
      return res.status(404).json({ message: 'El concurso especificado no existe' });
    }

    // Preparar datos para actualización
    const data = {
      contest_id: parseInt(contest_id),
      url: url || null,
      object: object || null
    };

    // Actualizar registro
    await global.knex('contests_records')
      .where('id', id)
      .update(data);

    // Obtener el registro actualizado
    const updatedRecord = await global.knex('contests_records')
      .where('id', id)
      .first();

    // Log de operación
    await LogOperacion(
      req.user.id,
      `Actualización de contest_record ID ${id} - ${req.user.username}`,
      JSON.stringify({ id, contest_id }),
      new Date()
    );

    res.json({
      success: true,
      message: 'Registro actualizado exitosamente',
      data: updatedRecord
    });
  } catch (error) {
    console.error(`Error en PUT /contest-record/${req.params.id}:`, error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar registro', 
      error: error.message 
    });
  }
});

// PATCH /contest-record/:id - Actualización parcial de registro
router.patch('/:id', authMiddleware, writeProtection, async (req, res) => {
  try {
    // Solo administradores pueden actualizar registros
    if (req.user.role_id != '1') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado: solo administradores pueden actualizar registros' 
      });
    }

    const { id } = req.params;
    const { contest_id, url, object } = req.body;

    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    // Verificar que el registro existe
    const recordExists = await global.knex('contests_records')
      .where('id', id)
      .first();

    if (!recordExists) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    // Preparar datos para actualización parcial
    const data = {};

    if (contest_id !== undefined) {
      // Validar que contest_id sea un número
      if (isNaN(parseInt(contest_id))) {
        return res.status(400).json({ message: 'El campo contest_id debe ser un número' });
      }

      // Verificar que el concurso existe
      const contestExists = await global.knex('contest')
        .where('id', contest_id)
        .first();

      if (!contestExists) {
        return res.status(404).json({ message: 'El concurso especificado no existe' });
      }

      data.contest_id = parseInt(contest_id);
    }

    if (url !== undefined) {
      data.url = url || null;
    }

    if (object !== undefined) {
      data.object = object || null;
    }

    // Si no hay campos para actualizar
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
    }

    // Actualizar registro
    await global.knex('contests_records')
      .where('id', id)
      .update(data);

    // Obtener el registro actualizado
    const updatedRecord = await global.knex('contests_records')
      .where('id', id)
      .first();

    // Log de operación
    await LogOperacion(
      req.user.id,
      `Actualización parcial de contest_record ID ${id} - ${req.user.username}`,
      JSON.stringify({ id, updatedFields: Object.keys(data) }),
      new Date()
    );

    res.json({
      success: true,
      message: 'Registro actualizado exitosamente',
      data: updatedRecord
    });
  } catch (error) {
    console.error(`Error en PATCH /contest-record/${req.params.id}:`, error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar registro', 
      error: error.message 
    });
  }
});

// DELETE /contest-record/:id - Eliminar registro
router.delete('/:id', authMiddleware, writeProtection, async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    // Solo administradores pueden eliminar
    if (req.user.role_id != '1') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acceso denegado: solo administradores pueden eliminar registros' 
      });
    }

    // Verificar que el registro existe
    const recordExists = await global.knex('contests_records')
      .where('id', id)
      .first();

    if (!recordExists) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    // Eliminar registro
    await global.knex('contests_records')
      .where('id', id)
      .del();

    // Log de operación
    await LogOperacion(
      req.user.id,
      `Eliminación de contest_record ID ${id} - ${req.user.username}`,
      JSON.stringify({ id, deleted_record: recordExists }),
      new Date()
    );

    res.json({
      success: true,
      message: 'Registro eliminado exitosamente'
    });
  } catch (error) {
    console.error(`Error en DELETE /contest-record/${req.params.id}:`, error);
    res.status(500).json({ 
      success: false,
      message: 'Error al eliminar registro', 
      error: error.message 
    });
  }
});

module.exports = router;
