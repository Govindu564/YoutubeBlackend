const express = require("express");
const  videoController = require("../controllers/videoController");

const videoRouter = express.Router();

videoRouter.post("/createvideo",videoController.uploadVideo);
videoRouter.get("/allvideos",videoController.getAllVideos);
videoRouter.get("/uservideos/:userId",videoController.getCurrentUserVideos);
videoRouter.delete("/deleteuservideos/:userId/:videoId",videoController.deleteUserVideo);
videoRouter.put("/updateuservideos/:userId/:videoId", videoController.updateVideoTitle);
videoRouter.post("/video/formats",videoController.downloadingUrlTest);
videoRouter.post("/video/download",videoController.downloadingVideo);

module.exports  = videoRouter;