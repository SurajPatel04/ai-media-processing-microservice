import dotenv from "dotenv";
import app from "./app.js";
dotenv.config();

import connectDB from "./config/db.js";


const PORT = Number(process.env.PORT) || 8000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to connect DB:", err);
        process.exit(1);
    });