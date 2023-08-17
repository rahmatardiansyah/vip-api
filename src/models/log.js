const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LogSchema = new Schema({
  image: {
    type: String,
    required: true
  },
  'image-grayscale': {
    type: String,
    required: true
  },
  'image-log': {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('LogPost', LogSchema);
