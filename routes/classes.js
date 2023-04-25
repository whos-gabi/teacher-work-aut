const express = require("express");
const router = express.Router();
const {
  validateSession,
  fetchClasses,
  deleteClassById,
  findClassById,
  addClass,
  updateClassById,
} = require("../functions");
require("dotenv").config();

const sha256 = require("sha256");
const DB_NAME = process.env.DB_NAME;

router.get("/classes", async function (req, res) {
  validateSession(req, res);
  await fetchClasses(DB_NAME, req.cookies?.user).then((data) => {
    res.render("index", {
      title: "Clases",
      path: "pages/class/classes",
      classes: data,
      req: req,
    });
  });
});

router.post("/new/class", function (req, res) {
  validateSession(req, res);
  const newClass = {
    _id: sha256(req.body.name),
    name: req.body.name,
    description: req.body.description,
    frequency: req.body.frequency,
    students: [],
    planning: [],
    assignments: [],
  };
  addClass(DB_NAME, newClass, req.cookies?.user).then((result) => {
    console.log(result);
  });
  res.status(301).redirect("/classes?refresh=true");
});

router.post("/edit/class/:id", function (req, res) {
  validateSession(req, res);
  const editClass = {
    name: req.body.name,
    description: req.body.description,
    frequency: req.body.frequency,
  };
  var id = req.params.id;
  // Update the class in the database
  updateClassById(DB_NAME, id, req.cookies?.user, editClass)
    .then(() => {
      // Redirect back to the class page
      res.status(301).redirect("/class/" + id + "?refresh=true");
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Failed to update class");
    });
});

router.get("/class/:id", function (req, res) {
  validateSession(req, res);
  var id = req.params.id;
  // Find the class in the database
  findClassById(DB_NAME, id, req.cookies?.user)
    .then((data) => {
      try {
        //error here
        res.render("index", {
          title: "Class",
          path: "pages/class/class",
          data: data,
          planning: data.planning,
          req: req,
        });
      } catch (err) {
        console.log(err);
      }
    })
    .catch((err) => {
      //404
      console.log(err);
      res.status(404).send("Class not found");
    });
});

router.post("/delete/class/:id", function (req, res) {
  validateSession(req, res);
  // Retrieve the ID parameter from the URL
  var id = req.params.id;
  // Find the class in the database
  deleteClassById(DB_NAME, id, req.cookies?.user)
    .then((data) => {
      console.log("deleted class", data);
      res.status(301).redirect("/classes?refresh=true");
    })
    .catch((err) => {
      console.log(err);
      res.status(404).send("Class not found: " + err);
    });

  res.status(301).redirect("/classes?refresh=true");
});

module.exports = router;
