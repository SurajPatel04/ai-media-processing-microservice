import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUserFromAllDevices,
    refreshAccessToken
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { registerSchema, loginSchema } from "../schema/auth.schema.js";

const router = Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", authenticate, logoutUserFromAllDevices);


export default router;
