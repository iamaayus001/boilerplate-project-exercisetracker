const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory data storage
let users = [];
let nextId = 1;

// POST /api/users - Create a new user
app.post("/api/users", (req, res) => {
  const { username } = req.body;
  if (!username || username.trim() === "") {
    return res.status(400).json({ error: "Username is required" });
  }
  const user = {
    username: username.trim(),
    _id: nextId.toString(),
    exercises: [],
  };
  users.push(user);
  nextId++;
  res.json({ username: user.username, _id: user._id });
});

// GET /api/users - Retrieve all users
app.get("/api/users", (req, res) => {
  res.json(users.map((user) => ({ username: user.username, _id: user._id })));
});

// POST /api/users/:_id/exercises - Add an exercise
app.post("/api/users/:_id/exercises", (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  // Validation
  if (!description || description.trim() === "") {
    return res.status(400).json({ error: "Description is required" });
  }
  if (!duration) {
    return res.status(400).json({ error: "Duration is required" });
  }
  const durationNum = parseInt(duration);
  if (isNaN(durationNum) || durationNum <= 0) {
    return res
      .status(400)
      .json({ error: "Duration must be a positive number" });
  }

  const user = users.find((u) => u._id === _id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let exerciseDate;
  if (date) {
    exerciseDate = new Date(date);
    if (isNaN(exerciseDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }
  } else {
    exerciseDate = new Date();
  }

  const exercise = {
    description: description.trim(),
    duration: durationNum,
    date: exerciseDate,
  };
  user.exercises.push(exercise);

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
    _id: user._id,
  });
});

// GET /api/users/:_id/logs - Retrieve exercise log
app.get("/api/users/:_id/logs", (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  const user = users.find((u) => u._id === _id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let exercises = [...user.exercises];

  // Filter by 'from' date
  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      exercises = exercises.filter((ex) => ex.date >= fromDate);
    }
  }

  // Filter by 'to' date
  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      exercises = exercises.filter((ex) => ex.date <= toDate);
    }
  }

  // Apply limit
  if (limit) {
    const limitNum = parseInt(limit);
    if (!isNaN(limitNum) && limitNum >= 0) {
      exercises = exercises.slice(0, limitNum);
    }
  }

  const log = exercises.map((ex) => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date.toDateString(),
  }));

  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
