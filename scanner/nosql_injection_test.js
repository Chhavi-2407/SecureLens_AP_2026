const express = require("express");
const app = express();

const User = require("./models/User");

app.use(express.json());

app.post("/login", async (req, res) => {

    const username = req.body.username;

    const user = await User.findOne({
        username: username
    });

    res.json(user);

});

app.listen(3000);