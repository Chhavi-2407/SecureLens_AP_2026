const express = require("express");

const app = express();

const ALLOWED_DESTINATIONS = {
    home: "/",
    dashboard: "/dashboard",
    profile: "/profile",
};

app.get("/redirect", (req, res) => {

    const destination = req.query.destination;

    const safePath =
        ALLOWED_DESTINATIONS[destination] || "/";

    res.redirect(safePath);

});

app.listen(3000);