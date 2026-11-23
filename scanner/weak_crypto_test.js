const crypto = require("crypto");

// Weak hashing
const hash = crypto.createHash("md5");

hash.update("my-sensitive-data");

const result = hash.digest("hex");

// Weak encryption
const cipher = crypto.createCipher("des", "secret-key");

const encrypted = cipher.update(
    "sensitive-information",
    "utf8",
    "hex"
);

console.log(result);
console.log(encrypted);