const express = require("express");
const router = express.Router();
const { addStudent, addGrade, getPlanById } = require("../functions");
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
  //TODO: update with planning
  const classId = req.params.id;
  const email = req.params.email;
  const grade = req.body.grade;
  const planningId = req.body.planning;

  //get todays date and format as dd.mm.yyyy
  const date = new Date();
  const formattedDate = `${date.getDate()}.${
    date.getMonth() + 1
  }.${date.getFullYear()}`;


  const id = sha256(planningId + email);
  if (planningId == -1) {
    const newGrade = {
      _id: id,
      grade: grade,
      planning: {
        _id: sha256(id + "-1"),
        contents: "General",
        date: formattedDate,
        notes: "",
      },
    };
    await addGrade(
      DB_NAME,
      newGrade,
      classId,
      email,
      req.cookies?.user
    ).then((result) => {
      // console.log("result add grade", result);
      res.status(301).redirect("/class/" + req.params.id);
    });
  } else {
    getPlanById(DB_NAME, classId, planningId, req.cookies?.user).then(
      async (plan) => {

        const newGrade = {
          _id: id,
          grade: grade,
          planning: plan,
        };
        await addGrade(
          DB_NAME,
          newGrade,
          classId,
          email,
          req.cookies?.user
        ).then((result) => {
          // console.log("result add grade", result);
          res.status(301).redirect("/class/" + req.params.id);
        });
      }
    );
  }
});

module.exports = router;
