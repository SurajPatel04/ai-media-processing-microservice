import { vi, describe, it, expect } from 'vitest';

const { getCurrentUser } = await import('../src/controllers/user.controller.js');

describe('User Controller', () => {
    const mockRes = () => {
        const res = {};
        res.status = vi.fn().mockReturnValue(res);
        res.json = vi.fn().mockReturnValue(res);
        return res;
    };

    describe('getCurrentUser', () => {
        it('should return the current user attached to the request', async () => {
            const req = { user: { _id: 'user_1', email: 'test@test.com' } };
            const res = mockRes();
            const next = vi.fn();

            await getCurrentUser(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
            expect(res.json.mock.calls[0][0].data.user._id).toBe('user_1');
        });
    });
});
