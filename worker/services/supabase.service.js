import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.config.js';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

let supabaseClient = null;

const getSupabaseClient = () => {
    if (!supabaseClient) {
        supabaseClient = createClient(env.supabaseUrl, env.supabaseKey);
    }
    return supabaseClient;
};

export const uploadFileToSupabase = async (filePath, bucketName = 'documents', mimeType = 'application/octet-stream') => {
    const supabase = getSupabaseClient();

    const fileName = path.basename(filePath);
    const uniqueFilename = `${crypto.randomUUID()}-${fileName}`;

    const fileBuffer = await fs.promises.readFile(filePath);

    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(uniqueFilename, fileBuffer, {
            contentType: mimeType,
            upsert: false
        });

    if (error) {
        throw new Error(`Failed to upload to Supabase: ${error.message}`);
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(uniqueFilename, 7200);

    if (signedUrlError) {
        throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
    }

    return {
        storageKey: uniqueFilename,
        signedUrl: signedUrlData.signedUrl
    };
};

export const getFreshSignedUrl = async (storageKey, bucketName = 'documents') => {
    if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
        return storageKey;
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(storageKey, 7200);

    if (error) {
        throw new Error(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
};

export const deleteFileFromSupabase = async (storageKey, bucketName = 'documents') => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.storage
        .from(bucketName)
        .remove([storageKey]);

    if (error) {
        throw new Error(`Failed to delete from Supabase: ${error.message}`);
    }
};
