const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const { validateSession } = require("./functions");
const { fetchUsers, findUserByEmail, addUser } = require("./functions");
const { fetchClasses, findClassById, addClass } = require("./functions");
const { fetchStudents, findStudentById, addStudent } = require("./functions");
const {
  fetchAssignments,
  findAssignmentById,
  addAssignment,
} = require("./functions");

const authRoutes = require("./routes/auth");
const classesRoutes = require("./routes/classes");
const studentsRoutes = require("./routes/students");
// const assignmentsRoutes = require("./routes/assignments");
const planningRoutes = require("./routes/planning");

const sha256 = require("sha256");
const cookieParser = require("cookie-parser");
const app = express();

// Use cookie-parser middleware to handle cookies
app.use(cookieParser());
require("dotenv").config();
app.set("view engine", "ejs");
// app.use(express.static("public"));
app.use(express.static(__dirname + '/public'));

const DB_url =
  "mongodb+srv://" +
  process.env.MONG_USR +
  ":" +
  process.env.MONG_PWD +
  "@cluster0.84x1ogu.mongodb.net/?retryWrites=true&w=majority";
const DB_NAME = "teacher-ease";

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// Define routes
app.get("/", function (req, res) {
  res.render("index", { title: "Home", path: "pages/home", req: req || "" });
});

app.get("/auth", authRoutes);
app.get("/profile", authRoutes);
app.post("/logout", authRoutes);
app.post("/signup", authRoutes);
app.post("/login", authRoutes);

app.get("/classes", classesRoutes);
app.get("/class/:id", classesRoutes);

app.post("/new/class", classesRoutes);
app.post("/edit/class/:id", classesRoutes);
app.post("/delete/class/:id", classesRoutes);

app.get("/planning", planningRoutes);
app.get("/class/planning/:id", planningRoutes);
app.post("/new/plan", planningRoutes);
app.post("/delete/plan", planningRoutes);

app.post("/new/student", studentsRoutes);
app.post("/class/:id/student/:email/add/grade", studentsRoutes);
//add grade
//edit grade
//remove grade

//---------------------Routes-------------------

// Erorr pages ------------------
app.use((req, res) => {
  res.status(404).render("index", {
    title: "404",
    path: "error/error",
    data: {
      error: "404 Not Found",
      message: "Sorry, the page you are looking for could not be found.",
    },
    req: req,
  });
});
//500
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).render("index", {
    title: "500",
    path: "error/error",
    data: {
      error: "500 Internal Server Error",
      message: "Sorry, the server is experiencing some issues.",
    },
    req: req,
  });
});
app.use((err, req, res, next) => {
  console.log(err);
  res.status(503).render("index", {
    title: "503",
    path: "error/error",
    data: {
      error: "503 App Error",
      message: "Sorry, the server is experiencing some issues.",
    },
    req: req,
  });
});
//400
app.use((err, req, res, next) => {
  console.log(err);
  res.status(400).render("index", {
    title: "400",
    path: "error/error",
    data: {
      error: "400 Bad Request",
      message:
        "Sorry, your browser sent a request that this server could not understand.",
    },
    req: req,
  });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
