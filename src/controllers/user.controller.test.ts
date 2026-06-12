import request from 'supertest';

import app from '../app';
import { tokenService } from '../services/token.service';
import { userService } from '../services/user.service';

vi.mock('../services/user.service');
vi.mock('../services/token.service');

const mockedTokenPayload = {
    id: 1,
    email: 'test@example.com',
    name: 'test',
    role: 'USER' as const,
};

const mockedUser = {
    id: 1,
    name: 'test',
    email: 'test@example.com',
    accounts: [],
};

const VALID_TOKEN = 'valid-access-token';

describe('UserController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /users/me', () => {
        it('returns 200 with user data when token and user are valid', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedTokenPayload);
            vi.mocked(userService.findById).mockResolvedValue(mockedUser);

            const response = await request(app).get('/users/me').set('Authorization', `Bearer ${VALID_TOKEN}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockedUser);
        });

        it('calls findById with the user id from the token payload', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedTokenPayload);
            vi.mocked(userService.findById).mockResolvedValue(mockedUser);

            await request(app).get('/users/me').set('Authorization', `Bearer ${VALID_TOKEN}`);

            expect(userService.findById).toHaveBeenCalledWith(mockedTokenPayload.id);
        });

        it('returns 401 when Authorization header is missing', async () => {
            const response = await request(app).get('/users/me');

            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({ message: 'User is not authorized' });
            expect(userService.findById).not.toHaveBeenCalled();
        });

        it('returns 401 when token is invalid', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(null);

            const response = await request(app).get('/users/me').set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({ message: 'User is not authorized' });
            expect(userService.findById).not.toHaveBeenCalled();
        });

        it('returns 404 when user is not found', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedTokenPayload);
            vi.mocked(userService.findById).mockResolvedValue(null);

            const response = await request(app).get('/users/me').set('Authorization', `Bearer ${VALID_TOKEN}`);

            expect(response.status).toBe(404);
            expect(response.body).toMatchObject({ message: 'User not found' });
        });

        it('returns 500 on unexpected service error', async () => {
            vi.spyOn(console, 'error').mockImplementationOnce(() => {});
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedTokenPayload);
            vi.mocked(userService.findById).mockRejectedValue(new Error('DB connection lost'));

            const response = await request(app).get('/users/me').set('Authorization', `Bearer ${VALID_TOKEN}`);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Unexpected error' });
        });
    });
});
