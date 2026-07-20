import { z } from "zod";

export const registerSchema = z.object({
    fullName: z
        .string({ message: "Full name is required" })
        .min(3, "Full name must be at least 3 characters")
        .max(50, "Full name must be under 50 characters")
        .trim(),

    email: z
        .email("Invalid email address")
        .toLowerCase()
        .trim(),

    password: z
        .string({ message: "Password is required" })
        .min(8, "Password must be at least 8 characters")
        .max(64, "Password too long"),
});

export const loginSchema = z.object({
    email: z
        .email("Invalid email address")
        .toLowerCase()
        .trim(),

    password: z
        .string({ message: "Password is required" })
})

