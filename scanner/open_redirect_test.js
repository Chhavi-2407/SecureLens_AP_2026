const express = require("express");

const app = express();

app.get("/redirect", (req, res) => {

    const redirectUrl = req.query.url;

    // Unsafe user-controlled redirect
    res.redirect(redirectUrl);

});

app.listen(3000);