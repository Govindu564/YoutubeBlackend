const jwt = require("jsonwebtoken");
const ytdl = require("ytdl-core");
const mongoose = require("mongoose");
const User = require("../models/user");
const Video = require("../models/video");
const dotenv = require("dotenv");

dotenv.config();

const uploadVideo = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided!" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("Decoded token:", decoded);

    const userId = decoded.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    const { url, title } = req.body;
    if (!url || !title) {
      return res.status(400).json({ message: "URL and title are required!" });
    }

    // Check if the video already exists by URL
    const existingVideo = await Video.findOne({ url });
    if (existingVideo) {
      return res.status(400).json({ message: "This video already exists!" });
    }

    const newVideo = new Video({
      url,
      title,
      uploadedBy: userId,
    });

    const savedVideo = await newVideo.save();
    res.status(201).json({
      message: "Video uploaded successfully!",
      video: savedVideo,
    });
  } catch (err) {
    console.error("Error in uploadVideo:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

async function getAllVideos(req, res) {
  try {
    const videos = await Video.find({})
      .populate("uploadedBy", "username email")
      .select("-__v");

    if (!videos || videos.length === 0) {
      return res.status(404).json({ message: "No videos found!" });
    }

    res.status(200).json({
      message: "Videos fetched successfully!",
      videos,
    });
  } catch (err) {
    console.error("Error fetching videos:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

async function getCurrentUserVideos(req, res) {
  console.log("Request Params:", req.params);

  const { userId } = req.params;

  // Validate userId
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid or missing User ID!" });
  }

  try {
    // Fetch videos uploaded by the specific user
    const videos = await Video.find({ uploadedBy: userId })
      .populate("uploadedBy", "username email") // Include user info
      .select("-__v"); // Exclude __v field

    if (!videos || videos.length === 0) {
      return res.status(404).json({ message: "No videos found for this user!" });
    }

    console.log("Fetched Videos:", videos);

    return res.status(200).json({
      success: true,
      message: "Videos fetched successfully!",
      videos,
    });
  } catch (err) {
    console.error(
      "Error during fetching user videos in getCurrentUserVideos:",
      err.message
    );

    return res.status(500).json({
      success: false,
      message: "Server error while fetching videos.",
      error: err.message,
    });
  }
}

async function deleteUserVideo(req, res) {
  const { userId, videoId } = req.params;

  // Validate userId and videoId
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid userId or videoId." });
  }

  try {
    // Find the video to ensure it exists and belongs to the user
    const video = await Video.findOne({ _id: videoId, uploadedBy: userId });

    if (!video) {
      return res.status(404).json({ message: "Video not found or does not belong to the user." });
    }

    // Delete the video
    await Video.findByIdAndDelete(videoId);

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully.",
    });
  } catch (err) {
    console.error("Error during deleting user video:", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting the video.",
      error: err.message,
    });
  }
}
async function updateVideoTitle(req, res) {
  const { userId, videoId } = req.params;
  const { title } = req.body;

  // Validate userId, videoId, and title
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({ message: "Invalid userId or videoId." });
  }

  if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Title cannot be empty." });
  }

  try {
      // Find the video and verify ownership
      const video = await Video.findOne({ _id: videoId, uploadedBy: userId });
      if (!video) {
          return res.status(404).json({ message: "Video not found or does not belong to the user." });
      }

      // Update the title
      video.title = title;
      await video.save();

      return res.status(200).json({
          success: true,
          message: "Video title updated successfully.",
          video,
      });
  } catch (err) {
      console.error("Error during updating video title:", err.message);
      return res.status(500).json({
          success: false,
          message: "Server error while updating the video title.",
          error: err.message,
      });
  }
}
async function downloadingUrlTest(req, res) {
  // Extract token from Authorization header
  const token = req.headers.authorization?.split(" ")[1];

  // If no token is provided, return 401 Unauthorized
  if (!token) {
    return res.status(401).json({ message: "No token provided!" });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Decode the token to get the user ID
    const userId = decoded.id;

    // Check if the user exists in the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Extract YouTube URL from the request body
    const { url } = req.body;

    // Check if the URL is valid and a proper YouTube URL
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ message: "Invalid or missing YouTube URL!" });
    }

    // Fetch YouTube video info and available formats
    const info = await ytdl.getInfo(url);

    // Map through the available formats and extract useful information
    const formats = info.formats.map((format) => ({
      qualityLabel: format.qualityLabel || "Unknown Quality",
      container: format.container,
      url: format.url,
    }));

    // Send the available formats as a response
    res.status(200).json({
      message: "Formats fetched successfully!",
      formats,
    });

  } catch (err) {
    // Log the error message to help with debugging
    console.error("Error in downloadingUrlTest:", err.message);

    // Return 500 Internal Server Error if something goes wrong
    if (err.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "JWT malformed!" });
    }
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
}
// Function to download the selected video in the chosen format
async function downloadingVideo(req, res) {
  console.log("Received request body:", req.body);

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided!" });
  }

  try {
    // Verify token and decode it
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userId = decoded.id;

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Get the video URL and format from the request body
    const { url, format } = req.body;
    if (!url || !ytdl.validateURL(url)) {
      return res.status(400).json({ message: "Invalid or missing YouTube URL!" });
    }

    if (!format || !format.container || !format.quality) {
      return res.status(400).json({ message: "Format details are required!" });
    }

    // Set headers for downloading the video
    res.header("Content-Disposition", `attachment; filename="video.${format.container}"`);

    // Download and pipe the video to the response
    ytdl(url, { quality: format.quality }).pipe(res);
  } catch (err) {
    console.error("Error in downloadingVideo:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}
module.exports = {
  uploadVideo,
  getAllVideos,
  getCurrentUserVideos,
  deleteUserVideo,
  updateVideoTitle,
  downloadingUrlTest,
  downloadingVideo,
};
