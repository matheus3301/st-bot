const { model, Schema } = require('mongoose');

const schema = new Schema({
  code: {
    type: String,
    index: true,
    required: true,
    unique: true,
    sparse: true,
  },
});

module.exports = new model('Code', schema);
