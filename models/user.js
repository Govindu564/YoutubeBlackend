const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  videos: [{
    type: Schema.Types.ObjectId,
    ref: 'Video', // This stores the list of videos that the user has uploaded or interacted with
  }],
});

const User = mongoose.model('User', userSchema);
module.exports = User;
