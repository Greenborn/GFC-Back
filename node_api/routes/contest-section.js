const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const writeProtection = require('../middleware/writeProtection.js');
const LogOperacion = require('../controllers/log_operaciones.js');

// POST /contest-section - Crear relación contest_section
router.post('/', authMiddleware, writeProtection, async (req, res) => {
  try {
    if (!req.user || req.user.role_id != '1') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: solo administradores pueden crear contest_section'
      });
    }

    const { contest_id, section_id } = req.body;

    if (!contest_id || !section_id) {
      return res.status(400).json({
        success: false,
        message: 'Los campos contest_id y section_id son obligatorios'
      });
    }

    const contestIdNumber = parseInt(contest_id, 10);
    const sectionIdNumber = parseInt(section_id, 10);

    if (isNaN(contestIdNumber) || isNaN(sectionIdNumber)) {
      return res.status(400).json({
        success: false,
        message: 'contest_id y section_id deben ser números'
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

    const sectionExists = await global.knex('section')
      .where('id', sectionIdNumber)
      .first();

    if (!sectionExists) {
      return res.status(404).json({
        success: false,
        message: 'La sección especificada no existe'
      });
    }

    const data = {
      contest_id: contestIdNumber,
      section_id: sectionIdNumber
    };

    await global.knex('contest_section').insert(data);

    await LogOperacion(
      req.user.id,
      `Creación de ContestSection - ${req.user.username}`,
      JSON.stringify(data),
      new Date()
    );

    return res.status(201).json({
      success: true,
      message: 'Contest section creada exitosamente',
      data
    });
  } catch (error) {
    console.error('Error en POST /contest-section:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al crear contest_section',
      error: error.message
    });
  }
});

module.exports = router;
