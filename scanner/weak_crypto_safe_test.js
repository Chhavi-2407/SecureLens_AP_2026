const crypto = require("crypto");

// Strong hashing algorithm
const hash = crypto.createHash("sha256");

hash.update("my-data");

const result = hash.digest("hex");

// Strong encryption algorithm
const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.alloc(32),
    Buffer.alloc(12)
);

const encrypted = cipher.update(
    "sensitive-information",
    "utf8",
    "hex"
);

console.log(result);
console.log(encrypted);