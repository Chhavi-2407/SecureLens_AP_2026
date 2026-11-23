const express = require("express");
const fs = require("fs");

const app = express();

app.get("/file", (req, res) => {
    const filename = req.query.file;

    const filePath = "/uploads/" + filename;

    fs.readFile(filePath, (err, data) => {
        if (err) return res.status(404).send("Not found");
        res.send(data);
    });
});

app.listen(3000);