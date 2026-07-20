import { getCaptionModel } from "../utils/llm.utils.js";
import { ExternalServiceError } from "../utils/errors.utils.js";
import { HumanMessage } from "@langchain/core/messages";
import { imageCaptionSchema } from "../schemas/caption.schema.js";

export async function generateCaption(imageUrl) {
    try {

        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image from URL. Status: ${response.status}`);
        }

        const imageBuffer = await response.arrayBuffer();
        const base64Data = Buffer.from(imageBuffer).toString("base64");
        const mimeType = response.headers.get("content-type") || "image/jpeg";

        const model = await getCaptionModel();

        const structuredModel = model.withStructuredOutput(imageCaptionSchema, { name: "ImageCaption" });

        const message = new HumanMessage({
            content: [
                { type: "text", text: "Analyze this image and return the structured JSON data." },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } }
            ]
        });

        const result = await structuredModel.invoke([message]);

        if (!result || !result.caption) {
            throw new Error("No structured caption returned from LangChain model.");
        }

        return result;
    } catch (error) {
        throw new ExternalServiceError(`LangChain caption generation failed: ${error.message}`, error);
    }
}
