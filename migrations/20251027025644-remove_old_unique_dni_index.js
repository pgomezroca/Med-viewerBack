'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex('patients', 'dni');
      console.log('Índice único antiguo "dni" eliminado correctamente.');
    } catch (err) {
      console.warn('No se encontró índice "dni", intentando "patients_dni_unique"...');
      try {
        await queryInterface.removeIndex('patients', 'patients_dni_unique');
        console.log('Índice único antiguo "patients_dni_unique" eliminado correctamente.');
      } catch (err2) {
        console.warn('Ninguno de los índices antiguos fue encontrado, continuando...');
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('patients', ['dni'], {
      unique: true,
      name: 'patients_dni_unique',
    });
    console.log('✅ Índice único "patients_dni_unique" restaurado.');
  }
};
