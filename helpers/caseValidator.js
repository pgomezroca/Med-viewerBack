// helpers/caseValidator.js
const { Case } = require('../models');
const { Sequelize } = require('sequelize');

/**
 * Valida si existe un caso similar dentro de los últimos 6 meses
 * @param {string} dni - DNI del paciente
 * @param {string} region - Región del caso
 * @param {string} diagnostico - Diagnóstico del caso
 * @param {Date} fecha - Fecha a comparar (puede ser la fecha actual o una específica)
 * @param {number} userId - ID del usuario
 * @returns {Object|null} - Retorna el caso existente o null si no hay duplicado
 */
const validateDuplicateCase = async (dni, region, diagnostico, fecha, userId) => {
  try {
    const sixMonthsAgo = new Date(fecha);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const existingCase = await Case.findOne({
      where: {
        dni,
        region,
        diagnostico,
        uploaded_by: userId,
        createdAt: {
          [Sequelize.Op.between]: [sixMonthsAgo, fecha]
        }
      },
      order: [['createdAt', 'DESC']]
    });

    return existingCase;
  } catch (error) {
    console.error('Error en validateDuplicateCase:', error);
    return null;
  }
};

module.exports = { validateDuplicateCase };