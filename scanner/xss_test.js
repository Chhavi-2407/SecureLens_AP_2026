
const express = require("express");
const app = express();

app.get("/profile", (req, res) => {
  const userInput = req.query.name;

  const output = document.getElementById("output");

  // XSS vulnerability
  output.innerHTML = userInput;
});

app.listen(3000);
