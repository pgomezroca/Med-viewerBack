const { Region, Etiologia, Tejido, Diagnostico, Tratamiento } = require('../models');

/**
 * Devuelve el árbol jerárquico completo del usuario logueado
 * anidando regiones → etiologias → tejidos → diagnosticos → tratamientos
 */
const getEstructuraCompleta = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const regiones = await Region.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Etiologia,
          as: 'etiologias',
          include: [
            {
              model: Tejido,
              as: 'tejidos',
              include: [
                {
                  model: Diagnostico,
                  as: 'diagnosticos',
                  include: [
                    { model: Tratamiento, as: 'tratamientos' }
                  ]
                }
              ]
            }
          ]
        }
      ],
      order: [['id', 'ASC']]
    });

    res.json({ structure: regiones });
  } catch (error) {
    console.error('Error obteniendo estructura:', error);
    res.status(500).json({ error: 'Error al obtener estructura jerárquica' });
  }
};

/* ---------------------------
   CRUD DE REGIONES
----------------------------*/
const createRegion = async (req, res) => {
  try {
    const region = await Region.create({
      user_id: req.user.id,
      nombre: req.body.nombre
    });
    res.status(201).json(region);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear región' });
  }
};

const updateRegion = async (req, res) => {
  try {
    const region = await Region.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!region) return res.status(404).json({ error: 'Región no encontrada' });

    await region.update({ nombre: req.body.nombre });
    res.json(region);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar región' });
  }
};

const deleteRegion = async (req, res) => {
  try {
    const region = await Region.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!region) return res.status(404).json({ error: 'Región no encontrada' });

    await region.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar región' });
  }
};

/* ---------------------------
   CRUD DE ETIOLOGIAS
----------------------------*/
const createEtiologia = async (req, res) => {
  try {
    const etiologia = await Etiologia.create({
      user_id: req.user.id,
      region_id: req.body.region_id,
      nombre: req.body.nombre
    });
    res.status(201).json(etiologia);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear etiología' });
  }
};

const updateEtiologia = async (req, res) => {
  try {
    const etiologia = await Etiologia.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!etiologia) return res.status(404).json({ error: 'Etiología no encontrada' });

    await etiologia.update({ nombre: req.body.nombre });
    res.json(etiologia);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar etiología' });
  }
};

const deleteEtiologia = async (req, res) => {
  try {
    const etiologia = await Etiologia.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!etiologia) return res.status(404).json({ error: 'Etiología no encontrada' });

    await etiologia.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar etiología' });
  }
};

/* ---------------------------
   CRUD DE TEJIDOS
----------------------------*/
const createTejido = async (req, res) => {
  try {
    const tejido = await Tejido.create({
      user_id: req.user.id,
      etiologia_id: req.body.etiologia_id,
      nombre: req.body.nombre
    });
    res.status(201).json(tejido);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear tejido' });
  }
};

const updateTejido = async (req, res) => {
  try {
    const tejido = await Tejido.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!tejido) return res.status(404).json({ error: 'Tejido no encontrado' });

    await tejido.update({ nombre: req.body.nombre });
    res.json(tejido);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar tejido' });
  }
};

const deleteTejido = async (req, res) => {
  try {
    const tejido = await Tejido.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!tejido) return res.status(404).json({ error: 'Tejido no encontrado' });

    await tejido.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar tejido' });
  }
};

/* ---------------------------
   CRUD DE DIAGNOSTICOS
----------------------------*/
const createDiagnostico = async (req, res) => {
  try {
    const diagnostico = await Diagnostico.create({
      user_id: req.user.id,
      tejido_id: req.body.tejido_id,
      nombre: req.body.nombre
    });
    res.status(201).json(diagnostico);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear diagnóstico' });
  }
};

const updateDiagnostico = async (req, res) => {
  try {
    const diagnostico = await Diagnostico.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!diagnostico) return res.status(404).json({ error: 'Diagnóstico no encontrado' });

    await diagnostico.update({ nombre: req.body.nombre });
    res.json(diagnostico);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar diagnóstico' });
  }
};

const deleteDiagnostico = async (req, res) => {
  try {
    const diagnostico = await Diagnostico.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!diagnostico) return res.status(404).json({ error: 'Diagnóstico no encontrado' });

    await diagnostico.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar diagnóstico' });
  }
};

/* ---------------------------
   CRUD DE TRATAMIENTOS
----------------------------*/
const createTratamiento = async (req, res) => {
  try {
    const tratamiento = await Tratamiento.create({
      user_id: req.user.id,
      diagnostico_id: req.body.diagnostico_id,
      nombre: req.body.nombre
    });
    res.status(201).json(tratamiento);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear tratamiento' });
  }
};

const updateTratamiento = async (req, res) => {
  try {
    const tratamiento = await Tratamiento.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!tratamiento) return res.status(404).json({ error: 'Tratamiento no encontrado' });

    await tratamiento.update({ nombre: req.body.nombre });
    res.json(tratamiento);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar tratamiento' });
  }
};

const deleteTratamiento = async (req, res) => {
  try {
    const tratamiento = await Tratamiento.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!tratamiento) return res.status(404).json({ error: 'Tratamiento no encontrado' });

    await tratamiento.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar tratamiento' });
  }
};

module.exports = {
  // Estructura completa
  getEstructuraCompleta,

  // CRUDs individuales
  createRegion, updateRegion, deleteRegion,
  createEtiologia, updateEtiologia, deleteEtiologia,
  createTejido, updateTejido, deleteTejido,
  createDiagnostico, updateDiagnostico, deleteDiagnostico,
  createTratamiento, updateTratamiento, deleteTratamiento
};