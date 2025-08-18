const { User, Patient, Case, Image } = require('../models');
const s3 = require('../config/s3');
const multer = require('multer');
const path = require('path');
const { Op } = require('sequelize');

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

  let normalizedPhase = null;

  if(fase === '' || fase === null || fase === undefined) {
    normalizedPhase = fase?.toLowerCase() ?? 'pre';
  }

  normalizedPhase = fase?.toLowerCase() || 'pre';

  try {
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

    const newCase = await Case.create({
      patient_id: patient.id,
      region: region || null,
      etiologia: etiologia || null,
      tejido: tejido || null,
      diagnostico: diagnostico || null,
      tratamiento: tratamiento || null,
      dni: dni,
      uploadedBy: userId
    });

    if (files.length > 0) {
      await uploadAndAssociateImages(files, newCase.id, normalizedPhase, userId);
    }

    const caseWithImages = await Case.findByPk(newCase.id, {
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
      ...caseWithImages.toJSON(),
      patientCreated: !patient.createdAt
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
          required: true
        }
      ],
      where: {
        ...caseFilters
      }
    });
    res.json(data);
  } catch (err) {
    console.error('❌ Error al recuperar datos:', err);
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

const takePhotoAndCreateCase = async (req, res) => {
  try {
    const { dni, region, diagnostico, fase, etiologia, tejido, tratamiento } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'No se han subido imágenes'
      });
    }

    const files = req.files;

    let patient = await Patient.findOne({ dni });
    
    if (!patient) {
      patient = new Patient({ dni });
      await patient.save();
    }

    const newCase = new Case({
      patient_id: patient.id,
      region,
      diagnostico,
      fase,
      etiologia,
      tejido,
      tratamiento,
      uploaded_by: req.user.id
    });

    await newCase.save();

    uploadAndAssociateImages(files, newCase.id, fase, req.user.id)
      .then(() => {
        console.log('Imágenes subidas y asociadas al caso correctamente');
      })
      .catch((error) => {
        console.error('Error al subir imágenes:', error);
        throw error;
      });

    res.status(201).json({
      success: true,
      message: `Caso creado con ${req.files.length} imagen(es)`,
      caseId: newCase.id,
      patientId: patient.id
    });

  } catch (error) {
    console.error('Error en takePhotoAndCreateCase:', error);
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