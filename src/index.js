import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import cors from "cors";
import userRouter from "./routes/user.js";
import taskRouter from "./routes/task.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use("/api/auth", userRouter);
app.use("/api/task", taskRouter);

app.get("/", (req, res) => {
  res.send("Hello From Biswo 💖");
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`The App is Runging on PORT ${PORT}`);
    });
    console.log("MongoDB Connect SuccessFully");
  })
  .catch(err => {
    console.log("Error", err);
  });
