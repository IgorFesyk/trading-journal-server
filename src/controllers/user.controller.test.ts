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

const mockedAdminTokenPayload = {
    id: 2,
    email: 'admin@example.com',
    name: 'admin',
    role: 'ADMIN' as const,
};

const mockedUser = {
    id: 1,
    name: 'test',
    email: 'test@example.com',
    role: 'USER' as const,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockedAdminUser = {
    id: 2,
    name: 'admin',
    email: 'admin@example.com',
    role: 'ADMIN' as const,
    createdAt: new Date('2026-01-02T00:00:00.000Z'),
};

function serialized<T extends { createdAt: Date }>(user: T) {
    return { ...user, createdAt: user.createdAt.toISOString() };
}

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
            expect(response.body).toEqual(serialized(mockedUser));
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

    describe('GET /users', () => {
        it('returns 200 with the user list when caller is an admin', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedAdminTokenPayload);
            vi.mocked(userService.findAll).mockResolvedValue([mockedUser, mockedAdminUser]);

            const response = await request(app).get('/users').set('Authorization', `Bearer ${VALID_TOKEN}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual([serialized(mockedUser), serialized(mockedAdminUser)]);
        });

        it('passes the role query param through to findAll', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedAdminTokenPayload);
            vi.mocked(userService.findAll).mockResolvedValue([mockedAdminUser]);

            await request(app).get('/users?role=ADMIN').set('Authorization', `Bearer ${VALID_TOKEN}`);

            expect(userService.findAll).toHaveBeenCalledWith('ADMIN');
        });

        it('returns 403 when caller is not an admin', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedTokenPayload);

            const response = await request(app).get('/users').set('Authorization', `Bearer ${VALID_TOKEN}`);

            expect(response.status).toBe(403);
            expect(userService.findAll).not.toHaveBeenCalled();
        });
    });

    describe('PATCH /users/:id/role', () => {
        it('returns 200 with the updated user when caller is an admin', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedAdminTokenPayload);
            vi.mocked(userService.updateRole).mockResolvedValue({ ...mockedUser, role: 'ADMIN' });

            const response = await request(app)
                .patch('/users/1/role')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send({ role: 'ADMIN' });

            expect(response.status).toBe(200);
            expect(userService.updateRole).toHaveBeenCalledWith(1, 'ADMIN');
            expect(response.body).toEqual(serialized({ ...mockedUser, role: 'ADMIN' }));
        });

        it('returns 400 when an admin tries to remove their own admin role', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedAdminTokenPayload);

            const response = await request(app)
                .patch(`/users/${mockedAdminTokenPayload.id}/role`)
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send({ role: 'USER' });

            expect(response.status).toBe(400);
            expect(userService.updateRole).not.toHaveBeenCalled();
        });

        it('returns 403 when caller is not an admin', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedTokenPayload);

            const response = await request(app)
                .patch('/users/1/role')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send({ role: 'ADMIN' });

            expect(response.status).toBe(403);
            expect(userService.updateRole).not.toHaveBeenCalled();
        });
    });
});
