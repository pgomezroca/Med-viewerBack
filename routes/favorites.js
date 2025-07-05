const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');

router.post('/', favoriteController.addFavorite);
router.delete('/:imageId', favoriteController.removeFavorite);
router.get('/', favoriteController.getFavoritesForUser);

module.exports = router;