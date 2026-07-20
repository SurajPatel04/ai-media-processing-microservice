import { uploadFileToSupabase, getFreshSignedUrl as getSupabaseSignedUrl, deleteFileFromSupabase } from "./supabase.service.js";

export const storageService = {
    uploadImage: async (filePath, bucketName, mimeType) => {
        return uploadFileToSupabase(filePath, bucketName, mimeType);
    },

    getSignedUrl: async (storageKey, bucketName) => {
        return getSupabaseSignedUrl(storageKey, bucketName);
    },

    deleteImage: async (storageKey, bucketName) => {
        return deleteFileFromSupabase(storageKey, bucketName);
    }
};
