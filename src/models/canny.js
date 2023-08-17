const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CannySchema = new Schema({
  image: {
    type: String,
    required: true
  },
  'image-grayscale': {
    type: String,
    required: true
  },
  'image-canny': {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('CannyPost', CannySchema);
