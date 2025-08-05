const { Case } = require('../models');
const s3 = require('../config/s3');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Subir imagen a un caso (o crear nuevo caso con una imagen)
const uploadImage = async (req, res) => {
  const file = req.file;
  const {
    region,
    etiologia,
    tejido,
    diagnostico,
    tratamiento,
    fase,
    optionalDNI
  } = req.body;

  const userId = req.user.id;

  if (!file) return res.status(400).json({ error: 'No se envió ninguna imagen' });

  const allowedPhases = ['pre', 'intra', 'post'];
  let normalizedPhase = fase?.toLowerCase();

  if (fase && !allowedPhases.includes(normalizedPhase)) {
    return res.status(400).json({ error: 'Fase inválida. Usa: pre, intra o post.' });
  }

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

  const finalDNI = optionalDNI || Date.now().toString();

  try {
    const uploadResult = await s3.upload(params).promise();

    const newCase = await Case.create({
      images: [uploadResult.Location],
      region: region ?? null,
      etiologia: etiologia ?? null,
      tejido: tejido ?? null,
      diagnostico: diagnostico ?? null,
      tratamiento: tratamiento ?? null,
      phase: normalizedPhase ?? null,
      optionalDNI: finalDNI,
      uploadedBy: userId
    });

    res.status(201).json(newCase);
  } catch (err) {
    console.error('❌ Error al subir imagen:', err);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
};

// Obtener casos con filtros
const getImages = async (req, res) => {
  const userId = req.user.id;
  const {
    region,
    etiologia,
    tejido,
    diagnostico,
    tratamiento,
    phase,
    dni,
    optionalDNI
  } = req.query;

  const filters = { uploadedBy: userId };

  if (region) filters.region = region;
  if (etiologia) filters.etiologia = etiologia;
  if (tejido) filters.tejido = tejido;
  if (diagnostico) filters.diagnostico = diagnostico;
  if (tratamiento) filters.tratamiento = tratamiento;
  if (phase) filters.phase = phase;
  if (dni || optionalDNI) filters.optionalDNI = dni || optionalDNI;

  try {
    const cases = await Case.findAll({
      where: filters,
      order: [['createdAt', 'DESC']],
    });
    res.json(cases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al recuperar casos' });
  }
};

// Actualizar un caso
const updateImage = async (req, res) => {
  const { id } = req.params;
  const {
    region,
    etiologia,
    tejido,
    diagnostico,
    tratamiento,
    phase,
    optionalDNI
  } = req.body;

  const updateFields = {};

  if (region) updateFields.region = region;
  if (etiologia) updateFields.etiologia = etiologia;
  if (tejido) updateFields.tejido = tejido;
  if (diagnostico) updateFields.diagnostico = diagnostico;
  if (tratamiento) updateFields.tratamiento = tratamiento;
  if (optionalDNI) updateFields.optionalDNI = optionalDNI;

  if (phase) {
    const allowedPhases = ['pre', 'intra', 'post'];
    const normalizedPhase = phase.toLowerCase();
    if (!allowedPhases.includes(normalizedPhase)) {
      return res.status(400).json({ error: 'Fase inválida. Usa: pre, intra o post.' });
    }
    updateFields.phase = normalizedPhase;
  }

  try {
    const [updatedCount] = await Case.update(updateFields, {
      where: { id }
    });

    if (updatedCount === 0) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }

    const updatedCase = await Case.findByPk(id);
    res.json(updatedCase);
  } catch (err) {
    console.error('❌ Error al actualizar caso:', err);
    res.status(500).json({ error: 'Error al actualizar caso' });
  }
};

// Eliminar caso e imagen
const deleteImage = async (req, res) => {
  const { id } = req.params;

  try {
    const caseItem = await Case.findByPk(id);
    if (!caseItem) return res.status(404).json({ error: 'Caso no encontrado' });

    const urls = caseItem.images || [];
    for (const url of urls) {
      const key = decodeURIComponent(new URL(url).pathname).replace(/^\/+/, '');
      const params = {
        Bucket: process.env.SPACES_BUCKET,
        Key: key
      };
      await s3.deleteObject(params).promise();
    }

    await caseItem.destroy();

    res.json({ message: 'Caso eliminado correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar caso:', err);
    res.status(500).json({ error: 'Error al eliminar caso' });
  }
};

// Casos con datos incompletos
const getIncompleteImages = async (req, res) => {
  const userId = req.user.id;

  try {
    const cases = await Case.findAll({
      where: {
        uploadedBy: userId,
        region: { [Op.ne]: null },
        diagnostico: { [Op.ne]: null },
        [Op.or]: [
          { etiologia: null },
          { tejido: null },
          { tratamiento: null },
          { phase: null }
        ]
      },
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    res.json(cases);
  } catch (err) {
    console.error('❌ Error al buscar casos incompletos:', err);
    res.status(500).json({ error: 'Error al recuperar casos incompletos' });
  }
};

module.exports = {
  upload,
  uploadImage,
  getImages,
  updateImage,
  deleteImage,
  getIncompleteImages
};