const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/formularioJerarquicoController');

// Estructura completa
router.get('/formulario-jerarquico', auth, ctrl.getEstructuraCompleta);

// Regiones
router.post('/formulario-jerarquico/regions', auth, ctrl.createRegion);
router.put('/formulario-jerarquico/regions/:id', auth, ctrl.updateRegion);
router.delete('/formulario-jerarquico/regions/:id', auth, ctrl.deleteRegion);

// Etiologías
router.post('/formulario-jerarquico/etiologias', auth, ctrl.createEtiologia);
router.put('/formulario-jerarquico/etiologias/:id', auth, ctrl.updateEtiologia);
router.delete('/formulario-jerarquico/etiologias/:id', auth, ctrl.deleteEtiologia);

// Tejidos
router.post('/formulario-jerarquico/tejidos', auth, ctrl.createTejido);
router.put('/formulario-jerarquico/tejidos/:id', auth, ctrl.updateTejido);
router.delete('/formulario-jerarquico/tejidos/:id', auth, ctrl.deleteTejido);

// Diagnósticos
router.post('/formulario-jerarquico/diagnosticos', auth, ctrl.createDiagnostico);
router.put('/formulario-jerarquico/diagnosticos/:id', auth, ctrl.updateDiagnostico);
router.delete('/formulario-jerarquico/diagnosticos/:id', auth, ctrl.deleteDiagnostico);

// Tratamientos
router.post('/formulario-jerarquico/tratamientos', auth, ctrl.createTratamiento);
router.put('/formulario-jerarquico/tratamientos/:id', auth, ctrl.updateTratamiento);
router.delete('/formulario-jerarquico/tratamientos/:id', auth, ctrl.deleteTratamiento);

module.exports = router;