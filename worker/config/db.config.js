import mongoose from "mongoose";
import { env } from "./env.config.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${env.dbUrl}/${env.dbName}`
        );
        console.log(
            `MongoDB connected !!! DB Host: ${connectionInstance.connection.host}`
        );
    } catch (error) {
        console.error("MongoDB connection error: ", error);
        process.exit(1);
    }
};

export default connectDB;