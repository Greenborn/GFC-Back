const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

function parseValue(value) {
  if (value === null || value === undefined) return null;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' ? parsed : value;
  } catch {
    return value;
  }
}

function stringifyValue(value) {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

// GET /user/preferences — Obtener todas las preferencias del usuario autenticado
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    const rows = await global.knex('user_preferences')
      .where({ user_id: req.user.id })
      .select('key', 'value');

    const preferences = {};
    for (const row of rows) {
      preferences[row.key] = parseValue(row.value);
    }

    res.json({ success: true, data: preferences });
  } catch (error) {
    console.error('Error en GET /user/preferences:', error);
    res.status(500).json({ success: false, message: 'Error al obtener preferencias' });
  }
});

// GET /user/preferences/:key — Obtener una preferencia específica
router.get('/preferences/:key', authMiddleware, async (req, res) => {
  try {
    const row = await global.knex('user_preferences')
      .where({ user_id: req.user.id, key: req.params.key })
      .first();

    if (!row) {
      return res.status(404).json({ success: false, message: 'Preferencia no encontrada' });
    }

    res.json({ success: true, data: { [row.key]: parseValue(row.value) } });
  } catch (error) {
    console.error('Error en GET /user/preferences/:key:', error);
    res.status(500).json({ success: false, message: 'Error al obtener preferencia' });
  }
});

// PUT /user/preferences — Crear o actualizar múltiples preferencias (upsert)
router.put('/preferences', authMiddleware, async (req, res) => {
  const preferences = req.body;

  if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences)) {
    return res.status(400).json({ success: false, message: 'El cuerpo debe ser un objeto clave-valor' });
  }

  try {
    const keys = Object.keys(preferences);

    // Validar que todas las claves sean propiedades permitidas
    const allowed = await global.knex('user_preferences_meta').select('key');
    const allowedKeys = new Set(allowed.map(r => r.key));
    const invalidKeys = keys.filter(k => !allowedKeys.has(k));

    if (invalidKeys.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Las siguientes claves no son propiedades permitidas',
        invalid_keys: invalidKeys
      });
    }

    const now = new Date();

    for (const key of keys) {
      const value = stringifyValue(preferences[key]);

      await global.knex('user_preferences')
        .insert({ user_id: req.user.id, key, value, created_at: now, updated_at: now })
        .onConflict(['user_id', 'key'])
        .merge({ value, updated_at: now });
    }

    // Devolver todas las preferencias actualizadas
    const rows = await global.knex('user_preferences')
      .where({ user_id: req.user.id })
      .select('key', 'value');

    const result = {};
    for (const row of rows) {
      result[row.key] = parseValue(row.value);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error en PUT /user/preferences:', error);
    res.status(500).json({ success: false, message: 'Error al guardar preferencias' });
  }
});

// DELETE /user/preferences/:key — Eliminar una preferencia
router.delete('/preferences/:key', authMiddleware, async (req, res) => {
  try {
    const deleted = await global.knex('user_preferences')
      .where({ user_id: req.user.id, key: req.params.key })
      .del();

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Preferencia no encontrada' });
    }

    res.json({ success: true, message: 'Preferencia eliminada' });
  } catch (error) {
    console.error('Error en DELETE /user/preferences/:key:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar preferencia' });
  }
});

module.exports = router;
