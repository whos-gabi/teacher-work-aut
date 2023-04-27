const express = require("express");
const router = express.Router();
const { addUser, findUserByEmail } = require("../functions");
require("dotenv").config();
const sha256 = require("sha256");
const DB_NAME = process.env.DB_NAME;

router.get("/auth", function (req, res) {
  res.render("index", {
    title: "Auth",
    path: "pages/auth",
    req: req,
  });
});
router.get("/profile", function (req, res) {
  //find user by email in req.cookies.user
  let email = req.cookies?.user;
  findUserByEmail(DB_NAME, email).then((data) => {
    res.render("index", {
      title: "Auth",
      path: "pages/profile",
      user: data,
      req: req,
    });
  });
});

router.post("/logout", function (req, res) {
  res.clearCookie("user");
  res.clearCookie("name");
  res.redirect("/");
});

router.post("/signup", async (req, res) => {
  const { firstname, lastname, email, password, confirmPassword } = req.body;

  try {
    // Check if the email is already registered
    const userExists = await findUserByEmail(DB_NAME, email);
    if (userExists) {
      return res.status(400).json({ error: "Email is already registered" });
    }
    // Check if the password and confirm password match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }
    // hash password with sha256
    const hashedPassword = sha256(password);

    // Add user to database
    const newUser = {
      firstname,
      lastname,
      email,
      password: hashedPassword,
      classes: [],
    };
    await addUser(DB_NAME, newUser);

    // Set a cookie with the user's email
    res.cookie("user", email, { maxAge: 900000, httpOnly: true });
    res.cookie("name", firstname + " " + lastname, {
      maxAge: 900000,
      httpOnly: true,
    });
    // Redirect to the authentication page with signup=true query parameter
    res.redirect("/auth?signup=false");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  console.log(req.body);
  const user = {
    email: req.body.email,
    password: req.body.password,
  };
  let remember = req.body.rememberUser;
  try {
    let fuser = await findUserByEmail(DB_NAME, user.email);
    if (fuser != null && fuser.password == sha256(user.password)) {
      console.log("User found");
      console.log("Log In User: \n", user);
      if (remember) {
        // Set a cookie with the user's email for 5 hours
        res.cookie("user", user.email, {
          maxAge: 5 * 60 * 60 * 1000,
          httpOnly: true,
        });
        res.cookie("name", firstname || "" + " " + lastname || "", {
          maxAge: 5 * 60 * 60 * 1000,
          httpOnly: true,
        });
      }
      res.redirect("/");
    } else {
      console.log("User not found");
      // res.redirect("/auth?signup=true");
      res.redirect("/");

    }
  } catch (e) {
    console.log(e);
    // res.redirect("/auth?signup=true");
    res.redirect("/");

  }

});

module.exports = router;
