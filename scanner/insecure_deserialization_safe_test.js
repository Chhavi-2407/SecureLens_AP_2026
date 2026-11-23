
const express = require("express");

const app = express();

app.use(express.json());

app.post("/import", (req, res) => {

    const payload = req.body.data;

    // Safe JSON parsing instead of unsafe object deserialization
    const userObject = JSON.parse(payload);

    res.json({
        success: true
    });
});
