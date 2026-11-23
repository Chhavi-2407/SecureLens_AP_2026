const express = require("express");
const axios = require("axios");

const app = express();

app.get("/fetch", async (req, res) => {
    const targetUrl = req.query.url;

    const response = await axios.get(targetUrl);

    res.send(response.data);
});

app.listen(3000);