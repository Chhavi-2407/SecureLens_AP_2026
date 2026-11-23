const express = require("express");
const axios = require("axios");

const app = express();

const ALLOWED_URL = "https://example.com";

app.get("/fetch", async (req, res) => {
    const response = await axios.get(ALLOWED_URL);

    res.send(response.data);
});

app.listen(3000);