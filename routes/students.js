const express = require("express");
const router = express.Router();
const { addStudent, addGrade } = require("../functions");
require("dotenv").config();
const sha256 = require("sha256");
const DB_NAME = process.env.DB_NAME;

router.post("/new/student", async (req, res) => {
  // console.log(req.body);
  const newStudent = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    classId: req.body.classId,
    gradeNr: 0,
    generalGrade: 0,
    grades: [],
  };
  await addStudent(
    DB_NAME,
    newStudent,
    newStudent.classId,
    req.cookies?.user
  ).then((result) => {
    // console.log("result add student", result);
    res.status(301).redirect("/class/" + newStudent.classId);
  });
});

router.post("/class/:id/student/:email/add/grade", async (req, res) => {
  // format date to dd.mm.yyyy
  const date = new Date(req.body.date);
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0"); //January is 0!
  const yyyy = date.getFullYear();
  req.body.date = dd + "." + mm + "." + yyyy;

  const id = sha256(req.body.date + req.params.email);

  const newGrade = {
    grade: req.body.grade,
    date: req.body.date,
    _id: id,
  };
  await addGrade(
    DB_NAME,
    newGrade,
    req.params.id,
    req.params.email,
    req.cookies?.user
  ).then((result) => {
    // console.log("result add grade", result);
    res.status(301).redirect("/class/" + req.params.id);
  });
});


module.exports = router;
