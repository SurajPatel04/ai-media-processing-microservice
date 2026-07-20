import { vi, describe, it, expect } from 'vitest';

vi.mock('../src/models/user.model.js', () => ({
    User: {
        findOne: vi.fn(),
        create: vi.fn(),
        findById: vi.fn(),
    }
}));

vi.mock('../src/services/auth.service.js', () => ({
    generateAuthTokens: vi.fn(),
}));

vi.mock('../src/models/refreshToken.model.js', () => ({
    RefreshToken: {
        updateMany: vi.fn(),
        findOne: vi.fn(),
        updateOne: vi.fn(),
    }
}));

vi.mock('../src/utils/hash.utils.js', () => ({
    hashToken: vi.fn(),
}));

const { registerUser, loginUser } = await import('../src/controllers/auth.controller.js');
const { User } = await import('../src/models/user.model.js');

describe('Auth Controller', () => {
    const mockRes = () => {
        const res = {};
        res.status = vi.fn().mockReturnValue(res);
        res.json = vi.fn().mockReturnValue(res);
        res.cookie = vi.fn();
        res.clearCookie = vi.fn();
        return res;
    };

    describe('registerUser', () => {
        it('should return 400 if fields are missing', async () => {
            const req = { body: {} };
            const res = mockRes();
            const next = vi.fn();

            await registerUser(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });

        it('should return 409 if user already exists', async () => {
            const req = { body: { fullName: 'Test', email: 'test@test.com', password: 'password123' } };
            const res = mockRes();
            const next = vi.fn();

            User.findOne.mockResolvedValueOnce({ email: 'test@test.com' });

            await registerUser(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(409);
        });
    });

    describe('loginUser', () => {
        it('should return 400 if email or password missing', async () => {
            const req = { body: {} };
            const res = mockRes();
            const next = vi.fn();

            await loginUser(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(400);
        });

        it('should return 401 if password invalid', async () => {
            const req = { body: { email: 'test@test.com', password: 'wrong' } };
            const res = mockRes();
            const next = vi.fn();

            const mockUser = {
                _id: 'user1',
                email: 'test@test.com',
                isPasswordCorrect: vi.fn().mockResolvedValue(false)
            };
            
            User.findOne.mockReturnValue({
                select: vi.fn().mockResolvedValue(mockUser)
            });

            await loginUser(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].statusCode).toBe(401);
        });
    });
});
