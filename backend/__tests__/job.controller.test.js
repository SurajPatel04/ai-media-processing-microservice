import { vi, describe, it, expect } from 'vitest';

vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn().mockReturnValue(false),
        promises: {
            unlink: vi.fn().mockResolvedValue(true)
        }
    },
    existsSync: vi.fn().mockReturnValue(false),
}));

vi.mock('file-type', () => ({
    fileTypeFromFile: vi.fn(),
}));

vi.mock('../src/services/job.service.js', () => ({
    getJobById: vi.fn(),
    createJob: vi.fn(),
    getJobsByUserId: vi.fn(),
    countJobsByUserId: vi.fn(),
    getJobStatsByUserId: vi.fn(),
}));

vi.mock('../src/services/storage.service.js', () => ({
    storageService: {
        uploadImage: vi.fn(),
        getSignedUrl: vi.fn(),
        deleteImage: vi.fn(),
    }
}));

vi.mock('../src/services/queue.service.js', () => ({
    enqueueImageJob: vi.fn(),
}));

vi.mock('../src/queues/image.queue.js', () => ({
    imageQueue: {
        remove: vi.fn(),
    }
}));

const { fileTypeFromFile } = await import('file-type');
const { getJobById } = await import('../src/services/job.service.js');
const { uploadJob, retryJob } = await import('../src/controllers/job.controller.js');
const { JOB_STATUS } = await import('../src/constants/job.constants.js');

describe('Job Controller', () => {
    const mockRes = () => {
        const res = {};
        res.status = vi.fn().mockReturnValue(res);
        res.json = vi.fn().mockReturnValue(res);
        return res;
    };
    
    describe('retryJob', () => {
        it('should return 400 if job is not failed', async () => {
            const req = { params: { id: 'job_123' }, user: { _id: 'user_1' } };
            const res = mockRes();
            const next = vi.fn();
            
            getJobById.mockResolvedValue({ _id: 'job_123', status: JOB_STATUS.COMPLETED });
            
            await retryJob(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(next.mock.calls[0][0].message).toBe("Only failed jobs can be retried");
        });
    });
    
    describe('uploadJob', () => {
        it('should reject non-image files via magic bytes', async () => {
            const req = { 
                file: { path: '/tmp/fake.pdf', originalname: 'fake.pdf' },
                user: { _id: 'user_1' }
            };
            const res = mockRes();
            const next = vi.fn();
            
            fileTypeFromFile.mockResolvedValue({ mime: 'application/pdf', ext: 'pdf' });
            
            await uploadJob(req, res, next);
            
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
            expect(next.mock.calls[0][0].message).toContain("Only authentic JPG, PNG, and WEBP files are allowed");
        });
    });
});
