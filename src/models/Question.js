const { model, Schema } = require('mongoose');

const schema = new Schema({
  number: {
    type: Number,
    index: true,
    required: true,
    unique: true,
    sparse: true,
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
});
