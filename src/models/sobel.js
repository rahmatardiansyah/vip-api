const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SobelSchema = new Schema({
  image: {
    type: String,
    required: true
  },
  'image-grayscale': {
    type: String,
    required: true
  },
  'image-sobel': {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('SobelPost', SobelSchema);
