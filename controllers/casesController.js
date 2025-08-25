const { Case, Image,Patient } = require("../models");
const { deleteFromSpaces }  = require("../helpers/deleteFromSpaces");
const { validateDuplicateCase } = require('../helpers/caseValidator');

//Crear caso vacío para paciente existente
const createEmptyCaseForExistingPatient = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      dni,
      region,
      diagnostico,
      fase,
      etiologia,
      tejido,
      tratamiento
    } = req.body;

    if (!dni) return res.status(400).json({ error: "DNI requerido" });
    if (!region) return res.status(400).json({ error: "region requerida" });
    if (!diagnostico) return res.status(400).json({ error: "diagnostico requerido" });

    // Normalizar fase
    const allowedPhases = ["pre", "intra", "post"];
    const normalizedPhase = allowedPhases.includes((fase || "").toLowerCase())
      ? (fase || "").toLowerCase()
      : "pre";

    // Verificar que el paciente exista y sea del usuario
    const patient = await Patient.findOne({
      where: { dni, user_id: userId }
    });
    if (!patient) {
      return res.status(404).json({ error: "Paciente no encontrado" });
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

    if (existingCase) {
      return res.status(409).json({ 
        error: "Ya existe un caso similar creado en los últimos 6 meses",
        existingCaseId: existingCase.id,
        message: "Utilice el caso existente en lugar de crear uno nuevo"
      });
    }

    // Crear caso vacío (estado abierto)
    const nuevoCaso = await Case.create({
      patient_id: patient.id,
      dni,
      region,
      diagnostico,
      etiologia: etiologia || null,
      tejido: tejido || null,
      tratamiento: tratamiento || null,
      fase: normalizedPhase,
      estado: "abierto",
      uploaded_by: userId
    });

    return res.status(201).json({
      case: {
        id: nuevoCaso.id,
        dni: nuevoCaso.dni,
        region: nuevoCaso.region,
        diagnostico: nuevoCaso.diagnostico,
        etiologia: nuevoCaso.etiologia,
        tejido: nuevoCaso.tejido,
        tratamiento: nuevoCaso.tratamiento,
        fase: nuevoCaso.fase,
        estado: nuevoCaso.estado,
        createdAt: nuevoCaso.createdAt
      }
    });
  } catch (err) {
    console.error("❌ Error createEmptyCaseForExistingPatient:", err);
    return res.status(500).json({ error: "Error al crear el caso" });
  }
};

//Actualizar datos de un caso
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

//Borrar imagen de un caso
const deleteCaseImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const image = await Image.findByPk(imageId);
    if (!image) return res.status(404).json({ error: "Imagen no encontrada" });

    await deleteFromSpaces(image.url);

    await image.destroy();

    res.json({ message: "Imagen eliminada correctamente" });
  } catch (err) {
    console.error("❌ Error eliminando imagen:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

//Borrar caso junto con todas sus imagenes y las del space
const deleteCaseWithImages = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseToDelete = await Case.findByPk(caseId);
    if (!caseToDelete) {
      return res.status(404).json({ error: "Caso no encontrado" });
    }

    const images = await Image.findAll({ where: { case_id: caseId } });

    const deleteImagePromises = images.map((image) =>
      deleteFromSpaces(image.url).catch((err) => {
        console.error(`❌ Error eliminando imagen de Spaces (ID: ${image.id}):`, err);
      })
    );

    await Promise.all(deleteImagePromises);

    await Image.destroy({ where: { case_id: caseId } });
    await caseToDelete.destroy();

    res.json({
      success: true,
      message: `Caso y ${images.length} imagen(es) asociadas eliminadas correctamente`,
    });
  } catch (err) {
    console.error("❌ Error eliminando caso:", err);
    res.status(500).json({
      error: "Error interno del servidor al eliminar el caso",
      details: err.message,
    });
  }
};

//Obtener data de un caso en especifico
const getCaseInfo = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;

    if (!caseId) {
      return res.status(400).json({ error: 'case_id es requerido' });
    }

    const caso = await Case.findOne({
      where: { id: caseId, uploaded_by: userId },
      include: [
        {
          model: Patient,
          as: 'patient'
        },
        {
          model: Image,
          as: 'images'
        }
      ]
    });

    if (!caso) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }

    res.status(200).json({
      success: true,
      data: caso
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

// Cambiar el estado de un caso
const changeCaseStatus = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { estado } = req.body;
    const userId = req.user.id;

    if (!caseId || !estado) {
      return res.status(400).json({ error: 'caseId y estado son requeridos' });
    }

    const [updated] = await Case.update(
      { estado },
      {
        where: { id: caseId, uploaded_by: userId }
      }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }

    res.status(200).json({
      success: true,
      message: 'Estado actualizado correctamente'
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = {
  updateCase,
  deleteCaseImage,
  deleteCaseWithImages,
  createEmptyCaseForExistingPatient,
  getCaseInfo,
  changeCaseStatus
};
