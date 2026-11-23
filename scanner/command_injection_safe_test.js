const { exec } = require("child_process");

const app = require("express")();

app.get("/ping", (req, res) => {
    const host = req.query.host;

    exec("ping -c 1 localhost", (err, stdout) => {
        res.send(stdout);
    });
});