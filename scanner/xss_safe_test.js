const userInput = req.query.name;

const output = document.getElementById("output");

// Safe alternative
output.textContent = userInput;