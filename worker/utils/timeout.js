import { ExternalServiceError } from "./errors.utils.js";

export async function withTimeout(promise, ms, message = "Operation timed out") {
    let timeout;
    const timeoutPromise = new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new ExternalServiceError(message)), ms);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        clearTimeout(timeout);
    }
}
