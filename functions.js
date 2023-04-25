const { MongoClient } = require("mongodb");

require("dotenv").config();

//setup connection to database
const DB_url =
  "mongodb+srv://" +
  process.env.MONG_USR +
  ":" +
  process.env.MONG_PWD +
  "@cluster0.84x1ogu.mongodb.net/?retryWrites=true&w=majority";
const DB_NAME = "teacher-ease";
// ------------------ MongoDB Atlas ------------------

async function fetchUsers(DB_NAME) {
  const client = new MongoClient(DB_url);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const users = await db.collection("users").find({}).toArray();
    return users;
  } catch (e) {
    console.log(e);
  } finally {
    client.close();
  }
}
async function findUserByEmail(DB_NAME, email) {
  let users = await fetchUsers(DB_NAME);
  let user = users.find((user) => user.email === email);
  return user;
}

async function addUser(DB_NAME, user) {
  const client = new MongoClient(DB_url);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const result = await db.collection("users").insertOne(user);
    return result;
  } catch (e) {
    console.log(e);
  } finally {
    client.close();
  }
}

async function addClass(DB_NAME, newClass, email) {
  const client = new MongoClient(DB_url);
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    // Find the user by email
    const user = await db.collection("users").findOne({ email: email });
    if (!user) {
      throw new Error("User not found");
    }
    // Add the new class object to the user's classes array
    user.classes.push(newClass);
    const updateResult = await db
      .collection("users")
      .updateOne({ email: email }, { $set: { classes: user.classes } });
    return updateResult;
  } catch (e) {
    console.log(e);
  } finally {
    client.close();
  }
}

async function fetchClasses(DB_NAME, userEmail) {
  const client = new MongoClient(DB_url);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const user = await db.collection("users").findOne({ email: userEmail });
    if (!user) {
      throw new Error(`User with email ${userEmail} not found`);
    }
    return user.classes;
  } catch (e) {
    console.log(e);
    throw e;
  } finally {
    client.close();
  }
}

async function findClassById(DB_NAME, id, userEmail) {
  const client = new MongoClient(DB_url);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const user = await db.collection("users").findOne({ email: userEmail });
    if (user) {
      const classFound = user.classes.find((c) => c._id.toString() === id);
      return classFound;
    }
    return null;
  } catch (e) {
    console.log(e);
  } finally {
    client.close();
  }
}

async function deleteClassById(DB_NAME, classId, userEmail) {
  const client = new MongoClient(DB_url);
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    // Find the user by email
    const user = await db.collection("users").findOne({ email: userEmail });
    if (!user) {
      throw new Error("User not found");
    }

    // Find the index of the class in the user's classes array
    const classIndex = user.classes.findIndex((c) => c._id === classId);
    if (classIndex === -1) {
      throw new Error("Class not found");
    }

    // Remove the class from the user's classes array
    user.classes.splice(classIndex, 1);

    // Update the user document in the database
    const updateResult = await db
      .collection("users")
      .updateOne({ email: userEmail }, { $set: { classes: user.classes } });

    return updateResult;
  } catch (e) {
    console.log(e);
  } finally {
    await client.close();
  }
}

async function addStudent(DB_NAME, newStudent, classId, userEmail) {
  const client = new MongoClient(DB_url);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const user = await db.collection("users").findOne({ email: userEmail });
    const classDoc = user.classes.find((c) => c._id.toString() === classId);

    // Check if a student with the same email already exists in the class
    const existingStudent = classDoc.students.find(
      (s) => s.email === newStudent.email
    );
    if (existingStudent) {
      throw new Error(
        "A student with this email already exists in this class."
      );
    }

    classDoc.students.push(newStudent);
    const replaceResult = await db
      .collection("users")
      .replaceOne({ email: userEmail }, user);
    return replaceResult;
  } catch (e) {
    console.log(e);
  } finally {
    await client.close();
  }
}

async function addGrade(DB_NAME, newGrade, classId, studentEmail, userEmail) {
  const client = new MongoClient(DB_url);
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    // Find the user by email
    const user = await db.collection("users").findOne({ email: userEmail });
    if (!user) {
      throw new Error("User not found");
    }

    // Find the class in the user's classes array
    const classIndex = user.classes.findIndex((c) => c._id === classId);
    if (classIndex === -1) {
      throw new Error("Class not found");
    }
    const classDoc = user.classes[classIndex];

    // Find the student in the class
    const studentIndex = classDoc.students.findIndex(
      (s) => s.email === studentEmail
    );
    if (studentIndex === -1) {
      throw new Error("Student not found");
    }
    const student = classDoc.students[studentIndex];
    // Add the new grade to the student's grades array
    student.grades.push(newGrade);
    student.gradeNr++;

    const generalGrade = calculateGeneralGrade(student.grades);
    student.generalGrade = generalGrade;

    // Update the class in the user's classes array
    const updateResult = await db
      .collection("users")
      .updateOne(
        { email: userEmail, "classes._id": classId },
        { $set: { "classes.$.students": classDoc.students } }
      );
    return updateResult;
  } catch (e) {
    console.log(e);
  } finally {
    await client.close();
  }
}
async function updateClassById(DB_NAME, classId, userEmail, newClassData) {
  const client = new MongoClient(DB_url);
  try {
    await client.connect();
    const database = client.db(DB_NAME);
    const users = database.collection("users");

    // Find the user with the specified email address and check if they have permission to update the class
    const user = await users.findOne({ email: userEmail });
    if (!user) {
      throw new Error("User does not have permission to update class");
    }

    // Update the class
    const result = await users.updateOne(
      { email: userEmail, "classes._id": classId },
      {
        $set: {
          "classes.$.name": newClassData.name,
          "classes.$.description": newClassData.description,
          "classes.$.frequency": newClassData.frequency,
        },
      }
    );

    return result.modifiedCount;
  } finally {
    await client.close();
  }
}

//planning
async function addPlanning(DB_NAME, planning, userEmail, classId) {
  const client = new MongoClient(DB_url);
  try {
    await client.connect();
    const database = client.db(DB_NAME);
    const users = database.collection("users");
    // Retrieve the user's classes array
    const user = await users.findOne({ email: userEmail });
    const classes = user.classes;
    // Find the class by id in the user's classes array
    const existingClass = classes.find((c) => c._id === classId);
    if (!existingClass) {
      throw new Error("Class not found");
    }
    // Add the new planning to the class's plannings array
    const newPlannings = existingClass.planning.concat([planning]);
    const updatedClass = { ...existingClass, planning: newPlannings };

    // Update the user's classes array with the updated class
    const updatedClasses = classes.map((c) =>
      c._id === classId ? updatedClass : c
    );
    await users.updateOne(
      { email: userEmail },
      { $set: { classes: updatedClasses } }
    );

    return true;
  } finally {
    await client.close();
  }
}

async function getPlanById(DB_NAME, classId, planId, userEmail) {
  const client = new MongoClient(DB_url);
  try {
    await client.connect();
    const database = client.db(DB_NAME);
    const users = database.collection("users");
    // Retrieve the user's classes array
    const user = await users.findOne({ email: userEmail });
    const classes = user.classes;
    // Find the class by id in the user's classes array
    const existingClass = classes.find((c) => c._id === classId);
    if (!existingClass) {
      throw new Error("Class not found");
    }
    // Find the plan by id in the class's plannings array
    const plan = existingClass.planning.find((p) => p._id === planId);
    if (!plan) {
      throw new Error("Plan not found");
    }
    return plan;
  } catch (e) {
    console.log(e);
  } finally {
    await client.close();
  }
}

function calculateGeneralGrade(grades) {
  let sum = 0;
  let count = 0;
  grades.forEach((gradeObj) => {
    sum += parseInt(gradeObj.grade);
    count++;
  });
  const generalGrade = sum / count;
  return generalGrade;
}

async function deletePlanById(DB_NAME, planningId, userEmail, classId) {
  const client = new MongoClient(DB_url);
  try {
    await client.connect();
    const database = client.db(DB_NAME);
    const users = database.collection("users");
    // Retrieve the user's classes array
    const user = await users.findOne({ email: userEmail });
    const classes = user.classes;
    // Find the class by id in the user's classes array
    const existingClass = classes.find((c) => c._id === classId);
    if (!existingClass) {
      throw new Error("Class not found");
    }
    // Find the planning by id in the class's plannings array
    const planningIndex = existingClass.planning.findIndex(
      (p) => p._id === planningId
    );
    if (planningIndex < 0) {
      throw new Error("Planning not found");
    }
    // Remove the planning from the class's plannings array
    const newPlannings = [...existingClass.planning];
    newPlannings.splice(planningIndex, 1);
    const updatedClass = { ...existingClass, planning: newPlannings };
    // Update the user's classes array with the updated class
    const updatedClasses = classes.map((c) =>
      c._id === classId ? updatedClass : c
    );
    await users.updateOne(
      { email: userEmail },
      { $set: { classes: updatedClasses } }
    );
    return true;
  } finally {
    await client.close();
  }
}

function validateSession(req, res) {
  if (
    req.cookies.user == null ||
    req.cookies.user == undefined ||
    req.cookies.user == "" ||
    req.cookies.user == " "
  ) {
    //TODO: also check in db for user mail existance
    res.redirect("/auth");
  }
}

module.exports = {
  fetchUsers,
  addUser,
  addClass,
  fetchClasses,
  findClassById,
  addStudent,
  addGrade,
  validateSession,
  findUserByEmail,
  deleteClassById,
  updateClassById,
  addPlanning,
  deletePlanById,
  getPlanById,
};
