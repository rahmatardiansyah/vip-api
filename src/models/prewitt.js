const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PrewittSchema = new Schema({
  image: {
    type: String,
    required: true
  },
  'image-grayscale': {
    type: String,
    required: true
  },
  'image-prewitt': {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('PrewittPost', PrewittSchema);
