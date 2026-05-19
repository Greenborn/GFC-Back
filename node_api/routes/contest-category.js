const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection.js');
const LogOperacion = require('../controllers/log_operaciones.js');

// POST /contest-category - Crear relación contest_category
router.post('/', authMiddleware, writeProtection, async (req, res) => {
  try {
    if (!req.user || req.user.role_id != '1') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: solo administradores pueden crear contest_category'
      });
    }

    const { contest_id, category_id } = req.body;

    if (!contest_id || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Los campos contest_id y category_id son obligatorios'
      });
    }

    const contestIdNumber = parseInt(contest_id, 10);
    const categoryIdNumber = parseInt(category_id, 10);

    if (isNaN(contestIdNumber) || isNaN(categoryIdNumber)) {
      return res.status(400).json({
        success: false,
        message: 'contest_id y category_id deben ser números'
      });
    }

    const contestExists = await global.knex('contest')
      .where('id', contestIdNumber)
      .first();

    if (!contestExists) {
      return res.status(404).json({
        success: false,
        message: 'El concurso especificado no existe'
      });
    }

    const categoryExists = await global.knex('category')
      .where('id', categoryIdNumber)
      .first();

    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'La categoría especificada no existe'
      });
    }

    const data = {
      contest_id: contestIdNumber,
      category_id: categoryIdNumber
    };

    await global.knex('contest_category').insert(data);

    await LogOperacion(
      req.user.id,
      `Creación de ContestCategory - ${req.user.username}`,
      JSON.stringify(data),
      new Date()
    );

    return res.status(201).json({
      success: true,
      message: 'Contest category creada exitosamente',
      data
    });
  } catch (error) {
    console.error('Error en POST /contest-category:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al crear contest_category',
      error: error.message
    });
  }
});

module.exports = router;
