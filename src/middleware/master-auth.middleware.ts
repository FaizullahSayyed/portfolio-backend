import 'dotenv/config';
import {compare} from "bcryptjs";
import type { RequestHandler } from "express";

export const requireMasterPassword: RequestHandler = async (req, res, next) => {
    const password = req.get("X-Master-Password");
    const passwordHash = process.env.HASHED_MASTER_PASSWORD;

    if (!passwordHash){
        res.status(500).json({ message: "Server misconfiguration: Master password hash not set.", });
        return;
    }

    if(!password){
        res.status(401).json({ message: "Master password is required." });
        return;
    }

    compare(password, passwordHash)
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
}