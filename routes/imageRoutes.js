const express = require('express');
const router = express.Router();
const patientsController = require('../controllers/patientsController');
const casesController = require('../controllers/casesController');
const auth = require('../middleware/authMiddleware');

//Crear paciente con su primer caso (Welcome.jsx)
router.post('/cases', auth, patientsController.upload.array('images'), patientsController.createCaseWithImages);

// NUEVO: crear caso vacío para paciente existente
router.post('/cases/create-empty', auth, casesController.createEmptyCaseForExistingPatient);
//Añadir imagenes/videos en un caso existente (RecoverPhoto.jsx)
router.post('/cases/:caseId/images', auth, patientsController.upload.array('images'), patientsController.addImagesToCase);

//Tomar foto o importar varias (ImportPhoto.jsx y TakePhoto.jsx)
router.post('/cases/take-photo-or-import', auth, patientsController.upload.array('images'), patientsController.takePhotoAndCreateCase);

//Buscar imagenes por DNI, region, diagnostico, fase, tejido, etiologia, tratamiento (RecoverPhoto.jsx, TakePhoto.jsx)
router.get('/search', auth, patientsController.getImages);

//Actualizar datos de un caso (CompleteImageLabels.jsx)
router.put('/:caseId', casesController.updateCase);

//Borrar imagen de un caso (Sin componente definido)
router.delete('/delete-image/:imageId', casesController.deleteCaseImage);

//Obtener casos con tags incompletos (CompleteImageLabels.jsx)
router.get("/incomplete", auth, patientsController.getIncompleteImages);

//Borrar caso (junto con todas sus imagenes y las del space) (CompleteImageLabels.jsx)
router.delete('/delete-case/:caseId', auth, casesController.deleteCaseWithImages);

//Obtener detalles de un caso en especifico (recibe case_id)
router.get('/cases/:caseId/images', auth, casesController.getCaseInfo);

//Cambiar el estado de un caso
router.put('/cases/:caseId/change-status', auth, casesController.changeCaseStatus);

//Cambiar la fecha de cirugía de un caso
router.put('/cases/:caseId/change-surgeon-date', auth, casesController.changeSurgeryDate);

module.exports = router;
