import multer from "multer";
import path from "path";
import fs from "fs";
import { ApiError } from "../utils/apiError.utils.js";

const tempDir = path.join(process.cwd(), "tmp");
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, "Invalid file type. Only JPG, PNG, and WEBP formats are allowed."), false);
    }
};

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter
});
