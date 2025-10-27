'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeConstraint('patients', 'patients_dni_unique');
      console.log('Constraint única global "patients_dni_unique" eliminada.');
    } catch (err) {
      console.warn('No se encontró constraint global "patients_dni_unique", continuando...');
    }

    await queryInterface.addConstraint('patients', {
      fields: ['user_id', 'dni'],
      type: 'unique',
      name: 'unique_user_dni'
    });

    console.log('Constraint compuesta "unique_user_dni" creada exitosamente.');
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeConstraint('patients', 'unique_user_dni');
      console.log('Constraint compuesta "unique_user_dni" eliminada.');
    } catch (err) {
      console.warn('No se encontró constraint "unique_user_dni", continuando...');
    }

    await queryInterface.addConstraint('patients', {
      fields: ['dni'],
      type: 'unique',
      name: 'patients_dni_unique'
    });

    console.log('Constraint única global "patients_dni_unique" restaurada.');
  }
};
