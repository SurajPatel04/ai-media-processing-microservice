import { z } from "zod";

export const imageCaptionSchema = z.object({
    caption: z
        .string()
        .describe("A concise natural language caption describing the image."),

    scene: z
        .string()
        .describe("A one sentence description of the overall scene."),

    dominantObjects: z
        .array(z.string())
        .max(10)
        .describe("Main objects visible in the image."),

    peopleCount: z
        .number()
        .int()
        .nonnegative()
        .describe("Estimated number of visible people."),

    isIndoor: z
        .boolean()
        .describe("Whether the scene appears to be indoors."),

    confidence: z
        .number()
        .min(0)
        .max(1)
        .describe("Model confidence for the caption."),
});
