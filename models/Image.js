const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  region: {
    type: String,
    enum: ['cuello', 'hombro', 'brazo', 'codo', 'antebrazo', 'muñeca', 'mano', 'microcirugia', 'det'],
    required: true
  },
  diagnosis: { type: String, required: true },
  phase: {
    type: String,
    enum: ['pre', 'intra', 'post'],
    required: true
  },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  optionalDNI: { type: String }
});

module.exports = mongoose.model('Image', imageSchema);