const Image = require('../models/Image');
const s3 = require('../config/s3');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({ storage });

//Subir casos
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

  const finalDNI = optionalDNI || Date.now().toString();

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
      optionalDNI: finalDNI
    });

    await image.save();

    res.status(201).json(image);
  } catch (err) {
    console.error('❌ Error al subir imagen:', err);
    res.status(500).json({ error: 'Error al subir la imagen' });
  }
};

//Recuperar casos mediante filtros por query params
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

//Editar un caso
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
    const updated = await Image.findByIdAndUpdate(id, updateFields, { new: true });

    if (!updated) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }

    res.json(updated);
  } catch (err) {
    console.error('❌ Error al actualizar imagen:', err);
    res.status(500).json({ error: 'Error al actualizar imagen' });
  }
};

//Borrar un caso + eliminación de la imagen en DoSpaces
const deleteImage = async (req, res) => {
  const { id } = req.params;

  try {
    const image = await Image.findById(id);
    if (!image) return res.status(404).json({ error: 'Imagen no encontrada' });

    const imageUrl = image.url;
    const key = decodeURIComponent(new URL(imageUrl).pathname).replace(/^\/+/, '');

    const params = {
      Bucket: process.env.SPACES_BUCKET,
      Key: key
    };

    await s3.deleteObject(params).promise();

    await image.deleteOne();

    res.json({ message: 'Imagen eliminada correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar imagen:', err);
    res.status(500).json({ error: 'Error al eliminar imagen' });
  }
};

//Recuperar casos con atributos incompletos para que el profesional termine de rellenar
const getIncompleteImages = async (req, res) => {
  try {
    const images = await Image.find({
      region: { $ne: null },
      diagnostico: { $ne: null },
      $or: [
        { etiologia: null },
        { tejido: null },
        { tratamiento: null },
        { phase: null }
      ]
    })
      .sort({ uploadedAt: -1 })
      .limit(20);

    res.json(images);
  } catch (err) {
    console.error('❌ Error al buscar imágenes incompletas:', err);
    res.status(500).json({ error: 'Error al recuperar imágenes incompletas' });
  }
};

module.exports = { upload, uploadImage, getImages, updateImage, deleteImage, getIncompleteImages };
