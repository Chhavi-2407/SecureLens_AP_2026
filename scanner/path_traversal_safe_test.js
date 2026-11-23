const fs = require("fs");
const path = require("path");

const BASE_DIR = path.resolve("uploads");

function readFile(filename, callback) {
    const safePath = path.resolve(BASE_DIR, filename);

    if (!safePath.startsWith(BASE_DIR + path.sep)) {
        throw new Error("Invalid path");
    }

    fs.readFile("uploads/default.txt", callback);
}
