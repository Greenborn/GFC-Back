const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection');
const LogOperacion = require('../controllers/log_operaciones.js');
const { isValidOrganizationType } = require('../utils/organizationType');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const items = await global.knex('metric_abm').orderBy('id', 'asc');
    await LogOperacion(
      req.user.id,
      `Consulta de métricas ABM - ${req.user.username}`,
      null,
      new Date()
    );
    res.json({ success: true, items });
  } catch (error) {
    console.error('Error en GET /metric-abm:', error);
    res.status(500).json({ success: false, message: 'Error al obtener métricas', error: error.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }
    const item = await global.knex('metric_abm').where({ id }).first();
    if (!item) {
      return res.status(404).json({ success: false, message: 'Métrica no encontrada' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error en GET /metric-abm/:id:', error);
    res.status(500).json({ success: false, message: 'Error al obtener métrica', error: error.message });
  }
});

router.post('/', authMiddleware, writeProtection, async (req, res) => {
  try {
    const { prize, score, organization_type } = req.body;

    if (!prize || score === undefined || score === null || !organization_type) {
      return res.status(400).json({ success: false, message: 'prize, score y organization_type son requeridos' });
    }
    const scoreNum = Number(score);
    if (!Number.isFinite(scoreNum) || !Number.isInteger(scoreNum) || scoreNum < 0) {
      return res.status(400).json({ success: false, message: 'El score debe ser un número entero positivo' });
    }
    if (!isValidOrganizationType(organization_type)) {
      return res.status(400).json({ success: false, message: `Tipo de organización inválido. Valores: INTERNO, EXTERNO, EXTERNO_0, EXTERNO_UNICEN` });
    }

    const [row] = await global.knex('metric_abm').insert({
      prize,
      score: scoreNum,
      organization_type
    }).returning('id');
    const id = row?.id ?? row;
    const created = await global.knex('metric_abm').where({ id }).first();

    await LogOperacion(
      req.user.id,
      `Creación de métrica ABM - ${req.user.username}`,
      JSON.stringify({ prize, score, organization_type }),
      new Date()
    );

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error en POST /metric-abm:', error);
    res.status(500).json({ success: false, message: 'Error al crear métrica', error: error.message });
  }
});

router.put('/:id', authMiddleware, writeProtection, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    const { prize, score, organization_type } = req.body;
    if (!prize || score === undefined || score === null || !organization_type) {
      return res.status(400).json({ success: false, message: 'prize, score y organization_type son requeridos' });
    }
    const scoreNum = Number(score);
    if (!Number.isFinite(scoreNum) || !Number.isInteger(scoreNum) || scoreNum < 0) {
      return res.status(400).json({ success: false, message: 'El score debe ser un número entero positivo' });
    }
    if (!isValidOrganizationType(organization_type)) {
      return res.status(400).json({ success: false, message: `Tipo de organización inválido. Valores: INTERNO, EXTERNO, EXTERNO_0, EXTERNO_UNICEN` });
    }

    const existing = await global.knex('metric_abm').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Métrica no encontrada' });
    }

    await global.knex('metric_abm').where({ id }).update({
      prize,
      score: scoreNum,
      organization_type
    });

    const updated = await global.knex('metric_abm').where({ id }).first();

    await LogOperacion(
      req.user.id,
      `Modificación de métrica ABM - ${req.user.username}`,
      JSON.stringify({ id, prize, score, organization_type }),
      new Date()
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error en PUT /metric-abm/:id:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar métrica', error: error.message });
  }
});

router.delete('/:id', authMiddleware, writeProtection, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ success: false, message: 'ID inválido' });
    }

    if (String(req.user.role_id) !== '1') {
      return res.status(403).json({ success: false, message: 'Solo administradores pueden eliminar métricas' });
    }

    const existing = await global.knex('metric_abm').where({ id }).first();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Métrica no encontrada' });
    }

    await global.knex('metric_abm').where({ id }).del();

    await LogOperacion(
      req.user.id,
      `Eliminación de métrica ABM - ${req.user.username}`,
      JSON.stringify({ id, ...existing }),
      new Date()
    );

    res.json({ success: true, message: 'Métrica eliminada correctamente' });
  } catch (error) {
    console.error('Error en DELETE /metric-abm/:id:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar métrica', error: error.message });
  }
});

module.exports = router;
