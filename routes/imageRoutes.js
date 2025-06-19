const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

router.post('/upload', imageController.upload.single('image'), imageController.uploadImage);
router.get('/search', imageController.getImages);

module.exports = router;
