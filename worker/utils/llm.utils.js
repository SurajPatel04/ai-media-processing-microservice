import { initChatModel } from "langchain/chat_models/universal";
import { env } from "../config/env.config.js";


export async function getCaptionModel() {
    const modelName = env.captionModel || "gemini-2.5-flash";

    return await initChatModel(modelName, {
        temperature: 0,
    });
}
