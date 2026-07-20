import vision from '@google-cloud/vision';
import { ExternalServiceError } from '../utils/errors.utils.js';

const client = new vision.ImageAnnotatorClient();

class GoogleVisionService {
    async analyze(imageUrl) {
        try {
            const [response] = await client.annotateImage({
                image: {
                    source: {
                        imageUri: imageUrl,
                    },
                },
                features: [
                    { type: "LABEL_DETECTION" },
                    { type: "SAFE_SEARCH_DETECTION" },
                    { type: "OBJECT_LOCALIZATION" },
                ],
            });

            const labels = response.labelAnnotations?.map(label => label.description) || [];
            const labelDetails = response.labelAnnotations?.map(label => ({
                description: label.description,
                score: label.score,
            })) || [];

            const safeSearch = response.safeSearchAnnotation ?? {
                adult: "UNKNOWN",
                violence: "UNKNOWN",
                medical: "UNKNOWN",
                spoof: "UNKNOWN",
                racy: "UNKNOWN",
            };

            const objects = response.localizedObjectAnnotations ?? [];
            const grouped = {};
            for (const o of objects) {
              grouped[o.name] ??= { count: 0, maxScore: 0 };
              grouped[o.name].count++;
              grouped[o.name].maxScore = Math.max(grouped[o.name].maxScore, o.score);
            }
            const detectedObjects = Object.entries(grouped).map(([name, data]) => ({
                name,
                count: data.count,
                confidence: data.maxScore
            }));

            return { labels, labelDetails, safeSearch, detectedObjects };
        } catch (error) {
            throw new ExternalServiceError("Google Vision analysis failed", error);
        }
    }
}

export default new GoogleVisionService();
