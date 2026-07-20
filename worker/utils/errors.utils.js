export class ExternalServiceError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = "ExternalServiceError";
        this.originalError = originalError;
    }
}

export class PermanentProcessingError extends Error {
    constructor(message, originalError = null) {
        super(message);
        this.name = "PermanentProcessingError";
        this.originalError = originalError;
    }
}
