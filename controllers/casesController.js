const { Case, Image } = require("../models");
const AWS = require("aws-sdk");

const s3 = new AWS.S3({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
});

const updateCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const {
      region,
      diagnostico,
      fase,
      dni,
      etiologia,
      tejido,
      tratamiento,
      estado,
    } = req.body;

    const caso = await Case.findByPk(caseId);
    if (!caso) {
      return res.status(404).json({ error: "Caso no encontrado" });
    }

    caso.region = region ?? caso.region;
    caso.etiologia = etiologia ?? caso.etiologia;
    caso.tejido = tejido ?? caso.tejido;
    caso.diagnostico = diagnostico ?? caso.diagnostico;
    caso.tratamiento = tratamiento ?? caso.tratamiento;
    caso.fase = fase ?? caso.fase;
    caso.dni = dni ?? caso.dni;
    caso.estado = estado ?? caso.estado;

    await caso.save();

    res.json({ message: "Caso actualizado correctamente", case: caso });
  } catch (error) {
    console.error("❌ Error en updateCase:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const deleteCaseImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await Image.findByPk(imageId);
    if (!image) return res.status(404).json({ error: "Imagen no encontrada" });

    const url = new URL(image.url);
    const key = url.pathname.startsWith("/")
      ? url.pathname.slice(1)
      : url.pathname;

    await s3
      .deleteObject({
        Bucket: process.env.SPACES_BUCKET,
        Key: key,
      })
      .promise();

    await image.destroy();

    res.json({ message: "Imagen eliminada correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando imagen:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const deleteCaseWithImages = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseToDelete = await Case.findByPk(caseId);
    if (!caseToDelete) {
      return res.status(404).json({ error: "Caso no encontrado" });
    }

    const images = await Image.findAll({ where: { case_id: caseId } });

    const deleteImagePromises = images.map(async (image) => {
      try {
        if (image.url) {
          const url = new URL(image.url);
          const key = url.pathname.startsWith("/") 
            ? url.pathname.slice(1) 
            : url.pathname;

          await s3.deleteObject({
            Bucket: process.env.SPACES_BUCKET,
            Key: key,
          }).promise();
        }
      } catch (err) {
        console.error(`Error eliminando imagen de Spaces (ID: ${image.id}):`, err);
      }
    });

    await Promise.all(deleteImagePromises);

    await Image.destroy({ where: { case_id: caseId } });

    await caseToDelete.destroy();

    res.json({ 
      success: true,
      message: `Caso y ${images.length} imagen(es) asociadas eliminadas correctamente` 
    });

  } catch (err) {
    console.error("❌ Error eliminando caso:", err);
    res.status(500).json({ 
      error: "Error interno del servidor al eliminar el caso",
      details: err.message 
    });
  }
};

module.exports = {
  updateCase,
  deleteCaseImage,
  deleteCaseWithImages
};
