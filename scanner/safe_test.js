// const userInput = req.query.id;

// db.query(
//     "SELECT * FROM users WHERE id = ?",
//     [userInput]
// );

const express = require("express");
const app = express();

app.get("/users", (req, res) => {
  const query = "SELECT * FROM users WHERE id = " + req.query.id;
  db.query(query);
});