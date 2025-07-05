const Favorite = require('../models/Favorite');

const addFavorite = async (req, res) => {
  try {
    const { imageId } = req.body;

    const existing = await Favorite.findOne({
      user: req.user.id,
      image: imageId
    });

    if (existing) return res.status(409).json({ message: 'Ya marcado como favorito' });

    const favorite = await Favorite.create({
      user: req.user.id,
      image: imageId
    });

    res.status(201).json(favorite);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al marcar favorito' });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const { imageId } = req.params;

    const deleted = await Favorite.findOneAndDelete({
      user: req.user.id,
      image: imageId
    });

    if (!deleted) return res.status(404).json({ message: 'No estaba marcado como favorito' });

    res.json({ message: 'Favorito eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar favorito' });
  }
};

const getFavoritesForUser = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id })
      .populate('image')
      .sort({ createdAt: -1 });

    res.json(favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener favoritos' });
  }
};

module.exports = {
  addFavorite,
  removeFavorite,
  getFavoritesForUser
};
