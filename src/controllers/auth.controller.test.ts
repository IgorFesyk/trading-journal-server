import request from 'supertest';

import app from '../app';
import { ApiError } from '../libs/api-error';
import { authService } from '../services/auth.service';

vi.mock('../services/auth.service');

const mockedUser = {
    id: 1,
    name: 'test',
    email: 'test@example.com',
};

const mockedTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
};

const validSignupBody = {
    name: mockedUser.name,
    email: mockedUser.email,
    password: 'password123',
};

const validSigninBody = {
    email: mockedUser.email,
    password: 'password123',
};

describe('AuthController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /auth/sign-up', () => {
        it('returns 201 with accessToken and user on success', async () => {
            vi.mocked(authService.signup).mockResolvedValue({
                tokens: mockedTokens,
                user: mockedUser,
            });

            const response = await request(app).post('/auth/sign-up').send(validSignupBody);

            expect(response.status).toBe(201);
            expect(response.body).toEqual({
                accessToken: mockedTokens.accessToken,
                user: mockedUser,
            });
        });

        it('returns 400 with message when email is already taken', async () => {
            vi.mocked(authService.signup).mockRejectedValue(ApiError.BadRequest('Sign up failed'));

            const response = await request(app).post('/auth/sign-up').send(validSignupBody);

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                message: 'Sign up failed',
            });
        });

        it('returns 500 on unexpected service error', async () => {
            vi.spyOn(console, 'error').mockImplementationOnce(() => {});
            vi.mocked(authService.signup).mockRejectedValue(new Error('DB connection lost'));

            const response = await request(app).post('/auth/sign-up').send(validSignupBody);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Unexpected error' });
        });

        describe('request validation', () => {
            it('returns 400 when name is missing', async () => {
                const response = await request(app)
                    .post('/auth/sign-up')
                    .send({ email: mockedUser.email, password: 'password123' });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('errors');
                expect(authService.signup).not.toHaveBeenCalled();
            });

            it('returns 400 when email is missing', async () => {
                const response = await request(app)
                    .post('/auth/sign-up')
                    .send({ name: mockedUser.name, password: 'password123' });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('errors');
                expect(authService.signup).not.toHaveBeenCalled();
            });

            it('returns 400 when email format is invalid', async () => {
                const response = await request(app)
                    .post('/auth/sign-up')
                    .send({ ...validSignupBody, email: 'not-an-email' });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('errors');
                expect(authService.signup).not.toHaveBeenCalled();
            });

            it('returns 400 when password is missing', async () => {
                const response = await request(app)
                    .post('/auth/sign-up')
                    .send({ name: mockedUser.name, email: mockedUser.email });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('errors');
                expect(authService.signup).not.toHaveBeenCalled();
            });

            it('returns 400 when password is shorter than 8 characters', async () => {
                const response = await request(app)
                    .post('/auth/sign-up')
                    .send({ ...validSignupBody, password: 'short' });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('errors');
                expect(authService.signup).not.toHaveBeenCalled();
            });

            it('returns 400 when password is longer than 64 characters', async () => {
                const response = await request(app)
                    .post('/auth/sign-up')
                    .send({ ...validSignupBody, password: 'a'.repeat(65) });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('errors');
                expect(authService.signup).not.toHaveBeenCalled();
            });
        });
    });

    describe('POST /auth/sign-in', () => {
        it('returns 200 with accessToken and user on valid credentials', async () => {
            vi.mocked(authService.signin).mockResolvedValue({
                tokens: mockedTokens,
                user: mockedUser,
            });

            const response = await request(app).post('/auth/sign-in').send(validSigninBody);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                accessToken: mockedTokens.accessToken,
                user: mockedUser,
            });
        });

        it('sets httpOnly refreshToken cookie on success', async () => {
            vi.mocked(authService.signin).mockResolvedValue({
                tokens: mockedTokens,
                user: mockedUser,
            });

            const response = await request(app).post('/auth/sign-in').send(validSigninBody);

            expect(response.headers['set-cookie']).toEqual(
                expect.arrayContaining([expect.stringContaining('refreshToken=refresh-token')])
            );
            expect(response.headers['set-cookie']).toEqual(
                expect.arrayContaining([expect.stringContaining('HttpOnly')])
            );
        });

        it('returns 400 when credentials are invalid', async () => {
            vi.mocked(authService.signin).mockRejectedValue(ApiError.BadRequest('Invalid credentials'));

            const response = await request(app).post('/auth/sign-in').send(validSigninBody);

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({ message: 'Invalid credentials' });
        });

        it('returns 500 on unexpected service error', async () => {
            vi.spyOn(console, 'error').mockImplementationOnce(() => {});
            vi.mocked(authService.signin).mockRejectedValue(new Error('DB connection lost'));

            const response = await request(app).post('/auth/sign-in').send(validSigninBody);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Unexpected error' });
        });

        describe('request validation', () => {
            it('returns 400 when email is missing', async () => {
                const response = await request(app).post('/auth/sign-in').send({ password: 'password123' });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('errors');
                expect(authService.signin).not.toHaveBeenCalled();
            });

            it('returns 400 when email format is invalid', async () => {
                const response = await request(app)
                    .post('/auth/sign-in')
                    .send({ ...validSigninBody, email: 'not-an-email' });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('errors');
                expect(authService.signin).not.toHaveBeenCalled();
            });

            it('returns 400 when password is missing', async () => {
                const response = await request(app).post('/auth/sign-in').send({ email: mockedUser.email });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('errors');
                expect(authService.signin).not.toHaveBeenCalled();
            });

            it('returns 400 when password is shorter than 8 characters', async () => {
                const response = await request(app)
                    .post('/auth/sign-in')
                    .send({ ...validSigninBody, password: 'short' });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('errors');
                expect(authService.signin).not.toHaveBeenCalled();
            });

            it('returns 400 when password is longer than 64 characters', async () => {
                const response = await request(app)
                    .post('/auth/sign-in')
                    .send({ ...validSigninBody, password: 'a'.repeat(65) });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('errors');
                expect(authService.signin).not.toHaveBeenCalled();
            });
        });
    });

    describe('POST /auth/logout', () => {
        it('returns 200 and clears refreshToken cookie', async () => {
            vi.mocked(authService.logout).mockResolvedValue(undefined);

            const response = await request(app).post('/auth/logout').set('Cookie', 'refreshToken=refresh-token');

            expect(response.status).toBe(200);
            expect(response.headers['set-cookie']).toEqual(
                expect.arrayContaining([expect.stringContaining('refreshToken=;')])
            );
        });

        it('calls logout service with the refreshToken from cookie', async () => {
            vi.mocked(authService.logout).mockResolvedValue(undefined);

            await request(app).post('/auth/logout').set('Cookie', 'refreshToken=refresh-token');

            expect(authService.logout).toHaveBeenCalledWith('refresh-token');
        });

        it('returns 500 on unexpected service error', async () => {
            vi.spyOn(console, 'error').mockImplementationOnce(() => {});
            vi.mocked(authService.logout).mockRejectedValue(new Error('DB connection lost'));

            const response = await request(app).post('/auth/logout').set('Cookie', 'refreshToken=refresh-token');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Unexpected error' });
        });
    });

    describe('POST /auth/refresh', () => {
        it('returns 200 with new accessToken and user on valid refreshToken cookie', async () => {
            vi.mocked(authService.refresh).mockResolvedValue({
                tokens: mockedTokens,
                user: mockedUser,
            });

            const response = await request(app).post('/auth/refresh').set('Cookie', 'refreshToken=refresh-token');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                accessToken: mockedTokens.accessToken,
                user: mockedUser,
            });
        });

        it('sets a new httpOnly refreshToken cookie on success', async () => {
            vi.mocked(authService.refresh).mockResolvedValue({
                tokens: mockedTokens,
                user: mockedUser,
            });

            const response = await request(app).post('/auth/refresh').set('Cookie', 'refreshToken=refresh-token');

            expect(response.headers['set-cookie']).toEqual(
                expect.arrayContaining([expect.stringContaining('refreshToken=refresh-token')])
            );
            expect(response.headers['set-cookie']).toEqual(
                expect.arrayContaining([expect.stringContaining('HttpOnly')])
            );
        });

        it('returns 401 when refreshToken cookie is missing', async () => {
            vi.mocked(authService.refresh).mockRejectedValue(ApiError.UnauthorizedError());

            const response = await request(app).post('/auth/refresh');

            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({ message: 'User is not authorized' });
        });

        it('returns 401 when refreshToken is invalid or expired', async () => {
            vi.mocked(authService.refresh).mockRejectedValue(ApiError.UnauthorizedError());

            const response = await request(app).post('/auth/refresh').set('Cookie', 'refreshToken=invalid-token');

            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({ message: 'User is not authorized' });
        });

        it('returns 500 on unexpected service error', async () => {
            vi.spyOn(console, 'error').mockImplementationOnce(() => {});
            vi.mocked(authService.refresh).mockRejectedValue(new Error('DB connection lost'));

            const response = await request(app).post('/auth/refresh').set('Cookie', 'refreshToken=refresh-token');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Unexpected error' });
        });
    });

    describe('POST /auth/google', () => {
        const validGoogleBody = { credential: 'valid-id-token' };

        it('returns 200 with accessToken and user on a valid Google ID token', async () => {
            vi.mocked(authService.signInWithGoogle).mockResolvedValue({
                tokens: mockedTokens,
                user: mockedUser,
            });

            const response = await request(app).post('/auth/google').send(validGoogleBody);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                accessToken: mockedTokens.accessToken,
                user: mockedUser,
            });
        });

        it('calls signInWithGoogle with the credential from the request body', async () => {
            vi.mocked(authService.signInWithGoogle).mockResolvedValue({
                tokens: mockedTokens,
                user: mockedUser,
            });

            await request(app).post('/auth/google').send(validGoogleBody);

            expect(authService.signInWithGoogle).toHaveBeenCalledWith('valid-id-token');
        });

        it('sets httpOnly refreshToken cookie on success', async () => {
            vi.mocked(authService.signInWithGoogle).mockResolvedValue({
                tokens: mockedTokens,
                user: mockedUser,
            });

            const response = await request(app).post('/auth/google').send(validGoogleBody);

            expect(response.headers['set-cookie']).toEqual(
                expect.arrayContaining([expect.stringContaining('refreshToken=refresh-token')])
            );
            expect(response.headers['set-cookie']).toEqual(
                expect.arrayContaining([expect.stringContaining('HttpOnly')])
            );
        });

        it('returns 401 when the Google ID token is invalid', async () => {
            vi.mocked(authService.signInWithGoogle).mockRejectedValue(ApiError.UnauthorizedError());

            const response = await request(app).post('/auth/google').send(validGoogleBody);

            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({ message: 'User is not authorized' });
        });

        it('returns 500 on unexpected service error', async () => {
            vi.spyOn(console, 'error').mockImplementationOnce(() => {});
            vi.mocked(authService.signInWithGoogle).mockRejectedValue(new Error('DB connection lost'));

            const response = await request(app).post('/auth/google').send(validGoogleBody);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Unexpected error' });
        });

        describe('request validation', () => {
            it('returns 400 when credential is missing', async () => {
                const response = await request(app).post('/auth/google').send({});

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('errors');
                expect(authService.signInWithGoogle).not.toHaveBeenCalled();
            });

            it('returns 400 when credential is an empty string', async () => {
                const response = await request(app).post('/auth/google').send({ credential: '' });

                expect(response.status).toBe(400);
                expect(response.body).toHaveProperty('errors');
                expect(authService.signInWithGoogle).not.toHaveBeenCalled();
            });
        });
    });
});
