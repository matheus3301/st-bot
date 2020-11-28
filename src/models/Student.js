const { model, Schema } = require('mongoose');

const schema = new Schema({
  chat_id: {
    type: String,
    index: true,
    required: true,
    unique: true,
    sparse: true,
  },
  first_name: {
    type: String,
    required: true,
  },
});

module.exports = new model('Student', schema);
