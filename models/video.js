const mongoose = require('mongoose');
const { Schema } = mongoose;

const videoSchema = new Schema({
  url: {
    type: String,
    required: true, 
    unique: true, 
  },
  title: {
    type: String,
    required: true, 
  },
  description: {
    type: String,
    default: '', 
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User', 
    required: true, 
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const Video = mongoose.model('Video', videoSchema);
module.exports = Video;
