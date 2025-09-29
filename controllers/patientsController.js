const { User, Patient, Case, Image } = require('../models');
const s3 = require('../config/s3');
const multer = require('multer');
const path = require('path');
const { Op } = require('sequelize');
const { validateDuplicateCase } = require('../helpers/caseValidator');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const createCaseWithImages = async (req, res) => {
  const files = req.files || [];
  const {
    region,
    etiologia,
    tejido,
    diagnostico,
    tratamiento,
    fase,
    dni,
    nombre,
    apellido
  } = req.body;

  const userId = req.user.id;

  let normalizedPhase = fase?.toLowerCase() || 'pre';

  try {
    if (!dni) return res.status(400).json({ error: "DNI requerido" });
    if (!region) return res.status(400).json({ error: "Región requerida" });
    if (!diagnostico) return res.status(400).json({ error: "Diagnóstico requerido" });

    let patient = await Patient.findOne({ where: { dni, user_id: userId } });
    
    if (!patient) {
      if (!nombre || !apellido) {
        return res.status(400).json({ 
          error: 'Para crear un nuevo paciente, se requieren nombre y apellido' 
        });
      }

      patient = await Patient.create({
        dni,
        nombre,
        apellido,
        user_id: userId
      });
    }

    // Validar si existe un caso similar en los últimos 6 meses
    const currentDate = new Date();
    const existingCase = await validateDuplicateCase(
      dni, 
      region, 
      diagnostico, 
      currentDate, 
      userId
    );

    let caseId;
    let isNewCase = true;

    if (existingCase) {
      caseId = existingCase.id;
      isNewCase = false;
      
      // Actualizar información adicional si es necesario
      await Case.update({
        etiologia: etiologia || existingCase.etiologia,
        tejido: tejido || existingCase.tejido,
        tratamiento: tratamiento || existingCase.tratamiento,
      }, {
        where: { id: caseId }
      });
    } else {
      // Crear nuevo caso
      const newCase = await Case.create({
        patient_id: patient.id,
        region,
        etiologia: etiologia || null,
        tejido: tejido || null,
        diagnostico,
        tratamiento: tratamiento || null,
        dni: dni,
        fase: normalizedPhase,
        uploaded_by: userId
      });
      caseId = newCase.id;
    }

    if (files.length > 0) {
      await uploadAndAssociateImages(files, caseId, normalizedPhase, userId);
    }

    const caseWithData = await Case.findByPk(caseId, {
      include: [{
        model: Image,
        as: 'images'
      }, {
        model: Patient,
        as: 'patient',
        attributes: ['id', 'dni', 'nombre', 'apellido']
      }]
    });

    res.status(201).json({
      ...caseWithData.toJSON(),
      patientCreated: !patient.createdAt,
      isNewCase: isNewCase,
      existingCaseId: existingCase ? existingCase.id : null
    });
  } catch (err) {
    console.error('❌ Error al crear caso con imágenes:', err);
    
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => e.message);
      return res.status(400).json({ error: 'Error de validación', details: errors });
    }
    
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Ya existe un paciente con este DNI' });
    }

    res.status(500).json({ error: 'Error al crear el caso con imágenes' });
  }
};

const addImagesToCase = async (req, res) => {
  const files = req.files;
  const { fase } = req.body;
  const userId = req.user.id;
  const { caseId } = req.params;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No se enviaron imágenes' });
  }

  const allowedPhases = ['pre', 'intra', 'post'];
  let normalizedPhase = fase?.toLowerCase();

  if (fase && !allowedPhases.includes(normalizedPhase)) {
    return res.status(400).json({ error: 'Fase inválida. Usa: pre, intra o post.' });
  }

  try {
    const existingCase = await Case.findOne({
      where: { id: caseId }
    });

    if (!existingCase) {
      return res.status(404).json({ error: 'Caso no encontrado o no pertenece al usuario' });
    }

    await uploadAndAssociateImages(files, caseId, normalizedPhase, userId);

    const updatedCase = await Case.findByPk(caseId, {
      include: [{
        model: Image,
        as: 'images'
      }]
    });

    res.status(200).json(updatedCase);
  } catch (err) {
    console.error('❌ Error al agregar imágenes al caso:', err);
    res.status(500).json({ error: 'Error al agregar imágenes al caso' });
  }
};

// Obtener todos los pacientes, casos e imágenes del usuario autenticado
const getImages = async (req, res) => {
  const userId = req.user.id;
  const { region, etiologia, tejido, diagnostico, tratamiento, phase, dni } = req.query;

  const caseFilters = {};
  if (region) caseFilters.region = region;
  if (etiologia) caseFilters.etiologia = etiologia;
  if (tejido) caseFilters.tejido = tejido;
  if (diagnostico) caseFilters.diagnostico = diagnostico;
  if (tratamiento) caseFilters.tratamiento = tratamiento;
  if (phase) caseFilters.phase = phase;
  if (dni) caseFilters.dni = dni;

  try {
    const data = await Case.findAll({
      include: [
        {
          model: Patient,
          as: 'patient',
          where: { user_id: userId },
          required: true
        },
        {
          model: Image,
          as: 'images',
          required: false
        }
      ],
      where: {
        ...caseFilters
      },
      order: [['createdAt', 'DESC']]
    });

    const transformedData = data.map(caseItem => ({
      ...caseItem.toJSON(),
      hasImages: caseItem.images && caseItem.images.length > 0,
      imagesCount: caseItem.images ? caseItem.images.length : 0
    }));

    res.json(transformedData);
  } catch (err) {
    console.error('❌ Error al recuperar casos:', err);
    res.status(500).json({ error: 'Error al recuperar casos' });
  }
};

// Obtener casos incompletos del usuario
const getIncompleteImages = async (req, res) => {
  const userId = req.user.id;

  try {
    const incompleteCases = await Case.findAll({
      include: [
        {
          model: Patient,
          as: 'patient',
          where: { user_id: userId },
          required: true
        },
        {
          model: Image,
          as: 'images',
          required: true
        }
      ],
      where: {
        [Op.or]: [
          { etiologia: null },
          { tejido: null },
          { tratamiento: null }
        ]
      }
    });

    res.json(incompleteCases);
  } catch (err) {
    console.error('❌ Error al buscar casos incompletos:', err);
    res.status(500).json({ error: 'Error al recuperar casos incompletos' });
  }
};

//Funcion helper interna que asocia y sube imagenes a un caso
const uploadAndAssociateImages = async (files, caseId, phase, userId) => {
  const uploadPromises = files.map(file => {
    const ext = path.extname(file.originalname);
    const uniqueId = Math.random().toString(36).substring(2, 8);
    const fileName = `${Date.now()}-${uniqueId}${ext}`;
    const key = `${userId}/${fileName}`;

    const params = {
      Bucket: process.env.SPACES_BUCKET,
      Key: key,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype
    };

    return s3.upload(params).promise();
  });

  const uploadResults = await Promise.all(uploadPromises);
  const imageUrls = uploadResults.map(result => result.Location);

  await Promise.all(
    imageUrls.map(url =>
      Image.create({
        case_id: caseId,
        url,
        fase: phase ?? 'pre'
      })
    )
  );

  return imageUrls;
};

//importar y crear caso (TakePhoto.jsx, ImportPhoto.jsx)
const takePhotoAndCreateCase = async (req, res) => {
  try {
    let { dni, region, diagnostico, fase, etiologia, tejido, tratamiento } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No se han subido imágenes' });
    }

    if (!region) return res.status(400).json({ error: "Región requerida" });
    if (!diagnostico) return res.status(400).json({ error: "Diagnóstico requerido" });

    const files = req.files;
    const userId = req.user.id;

    // Si no hay dni, generar uno temporal con Date.now()
    if (!dni) {
      dni = `sin_dni_${Date.now()}`;
      console.warn(`Creando paciente con DNI temporal: ${dni}`);
    }

    // Normalizar fase
    const normalizedPhase = fase?.toLowerCase() || 'pre';

    // Validar si existe un caso similar en los últimos 6 meses
    const currentDate = new Date();
    const existingCase = await validateDuplicateCase(
      dni,
      region,
      diagnostico,
      currentDate,
      userId
    );

    let patient = await Patient.findOne({
      where: { dni, user_id: userId }
    });

    if (!patient) {
      patient = await Patient.create({
        dni,
        user_id: userId,
        nombre: req.body.nombre || null,
        apellido: req.body.apellido || null
      });
    }

    let caseId;
    let isNewCase = true;

    if (existingCase) {
      caseId = existingCase.id;
      isNewCase = false;

      await Case.update({
        etiologia: etiologia || existingCase.etiologia,
        tejido: tejido || existingCase.tejido,
        tratamiento: tratamiento || existingCase.tratamiento,
      }, {
        where: { id: caseId, uploaded_by: userId }
      });
    } else {
      const newCase = await Case.create({
        patient_id: patient.id,
        region,
        diagnostico,
        fase: normalizedPhase,
        etiologia: etiologia || null,
        tejido: tejido || null,
        tratamiento: tratamiento || null,
        uploaded_by: userId,
        dni: dni
      });
      caseId = newCase.id;
    }

    try {
      await uploadAndAssociateImages(files, caseId, normalizedPhase, userId);
      console.log('Imágenes subidas y asociadas al caso correctamente');
    } catch (error) {
      console.error('Error al subir imágenes:', error);
      if (isNewCase) {
        await Case.destroy({ where: { id: caseId } });
      }
      throw error;
    }

    const caseWithDetails = await Case.findByPk(caseId, {
      include: [{
        model: Image,
        as: 'images'
      }, {
        model: Patient,
        as: 'patient',
        attributes: ['id', 'dni', 'nombre', 'apellido']
      }]
    });

    res.status(201).json({
      success: true,
      message: isNewCase
        ? `Caso creado con ${files.length} imagen(es)`
        : `Imágenes agregadas a caso existente (${files.length} imagen(es))`,
      caseId: caseId,
      patientId: patient.id,
      isNewCase: isNewCase,
      existingCaseId: existingCase ? existingCase.id : null,
      case: caseWithDetails.toJSON()
    });

  } catch (error) {
    console.error('Error en takePhotoAndCreateCase:', error);

    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(e => e.message);
      return res.status(400).json({
        error: 'Error de validación',
        details: errors
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        error: 'Ya existe un paciente con este DNI'
      });
    }

    res.status(500).json({
      message: 'Error al procesar las imágenes y crear el caso',
      error: error.message
    });
  }
};

module.exports = {
  upload,
  createCaseWithImages,
  addImagesToCase,
  getImages,
  getIncompleteImages,
  takePhotoAndCreateCase
};