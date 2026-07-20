import { uploadFileToSupabase, getFreshSignedUrl as getSupabaseSignedUrl } from "./supabase.service.js";

export const storageService = {
    uploadImage: async (filePath, bucketName, mimeType) => {
        return uploadFileToSupabase(filePath, bucketName, mimeType);
    },

    getSignedUrl: async (storageKey, bucketName) => {
        return getSupabaseSignedUrl(storageKey, bucketName);
    }
};
