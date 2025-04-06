const express = require("express");
const userRouter = require("./userRoute");
const videoRouter = require("./videoRoute");

const mainRouter = express.Router();

mainRouter.use(userRouter);
mainRouter.use(videoRouter);


mainRouter.get("/",(req,res)=>{
    res.send("welcome main route!");
});
module.exports = mainRouter;