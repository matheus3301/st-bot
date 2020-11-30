const { model, Schema } = require('mongoose');

const schema = new Schema({
  chat_id: {
    type: String,
    index: true,
    required: true,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: true,
  },
  username: String,
  submited_codes: [String],
  answered_questions: [Number],
  has_solved_enigma: Boolean,
});

module.exports = new model('Student', schema);
