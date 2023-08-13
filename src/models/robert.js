const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RobertSchema = new Schema({
  image: {
    type: String,
    required: true
  },
  'image-grayscale': {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('RobertPost', RobertSchema);
