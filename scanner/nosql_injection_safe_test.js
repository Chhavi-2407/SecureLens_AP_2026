const express = require("express");
const app = express();

const User = require("./models/User");

app.use(express.json());

app.post("/login", async (req, res) => {

    const username = req.body.username;

    // Accept only a plain string
    if (typeof username !== "string") {
        return res.status(400).json({
            error: "Invalid username"
        });
    }

    const user = await User.findOne({
        username: username
    });

    res.json(user);

});

app.listen(3000);