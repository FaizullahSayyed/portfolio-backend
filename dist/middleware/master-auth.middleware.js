"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireMasterPassword = void 0;
require("dotenv/config");
const bcryptjs_1 = require("bcryptjs");
const requireMasterPassword = async (req, res, next) => {
    const password = req.get("X-Master-Password");
    const passwordHash = process.env.HASHED_MASTER_PASSWORD;
    if (!passwordHash) {
        res.status(500).json({ message: "Server misconfiguration: Master password hash not set.", });
        return;
    }
    if (!password) {
        res.status(401).json({ message: "Master password is required." });
        return;
    }
    (0, bcryptjs_1.compare)(password, passwordHash)
        .then((isValid) => {
        if (!isValid) {
            res.status(401).json({ message: "Invalid master password." });
            return;
        }
        next();
    }).catch((error) => {
        console.error("Error comparing master password:", error);
        res.status(500).json({ message: "Internal server error." });
    });
};
exports.requireMasterPassword = requireMasterPassword;
