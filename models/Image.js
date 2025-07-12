const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  url: { type: String, required: false },
  region: { type: String, required: true },
  etiologia: { type: String, required: false },
  tejido: { type: String, required: false },
  diagnostico: { type: String, required: true },
  tratamiento: { type: String, required: false },
  phase: {
    type: String,
    enum: ['pre', 'intra', 'post'],
    required: false
  },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },

  optionalDNI: { type: String }
});

module.exports = mongoose.model('Image', imageSchema);