const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

router.post('/upload', imageController.upload.single('image'), imageController.uploadImage);
router.get('/search', imageController.getImages);
router.put('/:id', imageController.updateImage);
router.delete('/:id', imageController.deleteImage);
router.get("/incomplete", imageController.getIncompleteImages);

module.exports = router;
