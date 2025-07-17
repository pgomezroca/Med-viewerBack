const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const auth = require('../middleware/authMiddleware');

router.post('/upload', auth, imageController.upload.single('image'), imageController.uploadImage);
router.get('/search', auth, imageController.getImages);
router.put('/:id', imageController.updateImage);
router.delete('/:id', imageController.deleteImage);
router.get("/incomplete", auth, imageController.getIncompleteImages);

module.exports = router;
