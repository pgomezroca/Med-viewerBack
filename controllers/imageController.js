const Image = require('../models/Image');
const s3 = require('../config/s3');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadImage = async (req, res) => {
  const file = req.file;
  const {
    region,
    etiologia,
    tejido,
    diagnostico,
    tratamiento,
    fase,
    uploadedBy,
    optionalDNI
  } = req.body;

  if (!file) return res.status(400).json({ error: 'No se envió ninguna imagen' });

  let phase = fase;
  const allowedPhases = ['pre', 'intra', 'post'];
  const normalizedPhase = phase?.toLowerCase();

  if (!allowedPhases.includes(normalizedPhase)) {
    return res.status(400).json({ error: 'Fase inválida. Usa: pre, intra o post.' });
  }

  const fileName = Date.now() + path.extname(file.originalname);

  const params = {
    Bucket: process.env.SPACES_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ACL: 'public-read',
    ContentType: file.mimetype
  };

  try {
    const uploadResult = await s3.upload(params).promise();

    const image = new Image({
      url: uploadResult.Location,
      region,
      etiologia,
      tejido,
      diagnostico,
      tratamiento,
      phase: normalizedPhase,
      uploadedBy,
      optionalDNI
    });

    await image.save();

    res.status(201).json(image);
  } catch (err) {
    console.error('❌ Error al subir imagen:', err);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
};

const getImages = async (req, res) => {
  let {
    region,
    etiologia,
    tejido,
    diagnostico,
    tratamiento,
    phase,
    optionalDNI
  } = req.query;

  const filters = {};

  region = region ? region.toLowerCase() : null;

  if (region) filters.region = region;
  if (etiologia) filters.etiologia = etiologia;
  if (tejido) filters.tejido = tejido;
  if (diagnostico) filters.diagnostico = diagnostico;
  if (tratamiento) filters.tratamiento = tratamiento;
  if (phase) filters.phase = phase;
  if (optionalDNI) filters.optionalDNI = optionalDNI;

  try {
    const images = await Image.find(filters).sort({ uploadedAt: -1 });
    res.json(images);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al recuperar imágenes' });
  }
};

module.exports = { upload, uploadImage, getImages };
