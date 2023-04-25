const express = require("express");
const router = express.Router();
const {
  validateSession,
  fetchClasses,
  findClassById,
  addPlanning,
  deletePlanById,
} = require("../functions");
require("dotenv").config();
const sha256 = require("sha256");
const DB_NAME = process.env.DB_NAME;

router.get("/planning", function (req, res) {
  validateSession(req, res);
  fetchClasses(DB_NAME, req.cookies?.user).then((data) => {
    res.render("index", {
      title: "Planning",
      path: "pages/planning/planning",
      classes: data,
      req: req,
    });
  });
});

router.get("/class/planning/:id", function (req, res) {
  validateSession(req, res);
  //get class with the id
  var id = req.params.id;

  findClassById(DB_NAME, id, req.cookies?.user).then((data) => {
    console.log(data);
    res.render("index", {
      title: "Planning",
      path: "pages/planning/classPlanning",
      data: data,
      req: req,
    });
  });
});

router.post("/new/plan", async function (req, res) {
  validateSession(req, res);
  const userEmail = req.cookies?.user;
  const classId = req.body.classId;
  console.log(req.body);
  // Format date to dd.mm.yyyy
  const date = new Date(req.body.date);
  const formattedDate = `${date.getDate()}.${
    date.getMonth() + 1
  }.${date.getFullYear()}`;

  // Create new planning object
  const planning = {
    _id: sha256(req.body.contents),
    contents: req.body.contents,
    date: formattedDate,
    notes: req.body.notes || "",
  };
  try {
    await addPlanning(DB_NAME, planning, userEmail, classId).then((result) => {
      console.log(result);
      res.redirect(`/class/planning/${classId}?refresh=true`);
    });
  } catch (err) {
    console.error(err);
    res.redirect(`/planning?refresh=true`);
  }
  res.redirect(`/class/planning/${classId}?refresh=true`);
});

router.post("/delete/plan", function (req, res) {
  console.log("delete plan");
  validateSession(req, res);
  const userEmail = req.cookies?.user;
  const classId = req.body.classId;
  const planId = req.body.planId;
  console.log(req.body);

  // Delete the plan from the database
  deletePlanById(DB_NAME, planId, userEmail, classId)
    .then(() => {
      // Redirect back to the class page
      res.status(301).redirect(`/class/planning/${classId}?refresh=true`);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Failed to delete plan");
    });
});

module.exports = router;
