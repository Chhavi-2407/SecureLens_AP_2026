const userInput = req.query.id;

const id = userInput;

const query = "SELECT * FROM users WHERE id=" + id;

db.query(query);
