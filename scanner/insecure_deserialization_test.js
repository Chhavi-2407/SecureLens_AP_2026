
const express = require("express");
const serialize = require("node-serialize");

const app = express();

app.use(express.json());

app.post("/import", (req, res) => {

    const payload = req.body.data;

    // Unsafe deserialization of untrusted input
    const userObject = serialize.unserialize(payload);

    res.json({
        success: true
    });
});

app.listen(3000);
