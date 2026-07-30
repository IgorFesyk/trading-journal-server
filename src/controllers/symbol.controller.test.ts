import request from 'supertest';

import app from '../app';
import { ApiError } from '../libs/api-error';
import { symbolService } from '../services/symbol.service';
import { tokenService } from '../services/token.service';

vi.mock('../services/symbol.service');
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

const mockedSymbol = {
    id: 1,
    name: 'EUR/USD',
    category: 'FOREX' as const,
    published: true,
    tradeCount: 12,
};

const VALID_TOKEN = 'valid-access-token';

describe('SymbolController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /symbols', () => {
        it('returns 200 with the symbol list, including tradeCount', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedTokenPayload);
            vi.mocked(symbolService.findAll).mockResolvedValue([mockedSymbol]);

            const response = await request(app).get('/symbols').set('Authorization', `Bearer ${VALID_TOKEN}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual([mockedSymbol]);
        });

        it('passes the category query param through to findAll', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedTokenPayload);
            vi.mocked(symbolService.findAll).mockResolvedValue([mockedSymbol]);

            await request(app).get('/symbols?category=FOREX').set('Authorization', `Bearer ${VALID_TOKEN}`);

            expect(symbolService.findAll).toHaveBeenCalledWith('FOREX', undefined);
        });

        it('passes the published query param through to findAll', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedTokenPayload);
            vi.mocked(symbolService.findAll).mockResolvedValue([mockedSymbol]);

            await request(app).get('/symbols?published=false').set('Authorization', `Bearer ${VALID_TOKEN}`);

            expect(symbolService.findAll).toHaveBeenCalledWith(undefined, false);
        });

        it('returns 401 when Authorization header is missing', async () => {
            const response = await request(app).get('/symbols');

            expect(response.status).toBe(401);
            expect(symbolService.findAll).not.toHaveBeenCalled();
        });
    });

    describe('GET /symbols/:id', () => {
        it('returns 200 with the symbol', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedTokenPayload);
            vi.mocked(symbolService.findById).mockResolvedValue(mockedSymbol);

            const response = await request(app).get('/symbols/1').set('Authorization', `Bearer ${VALID_TOKEN}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockedSymbol);
        });

        it('returns 404 when symbol is not found', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedTokenPayload);
            vi.mocked(symbolService.findById).mockResolvedValue(null);

            const response = await request(app).get('/symbols/999').set('Authorization', `Bearer ${VALID_TOKEN}`);

            expect(response.status).toBe(404);
        });
    });

    describe('POST /symbols', () => {
        it('returns 201 with the created symbol when caller is an admin', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedAdminTokenPayload);
            vi.mocked(symbolService.create).mockResolvedValue({
                id: 1,
                name: 'GER40',
                category: 'INDICES',
                published: true,
            });

            const response = await request(app)
                .post('/symbols')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send({ name: 'GER40', category: 'INDICES' });

            expect(response.status).toBe(201);
            expect(symbolService.create).toHaveBeenCalledWith({ name: 'GER40', category: 'INDICES' });
        });

        it('returns 400 when the symbol name already exists', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedAdminTokenPayload);
            vi.mocked(symbolService.create).mockRejectedValue(
                ApiError.BadRequest('A symbol with this name already exists')
            );

            const response = await request(app)
                .post('/symbols')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send({ name: 'EUR/USD', category: 'FOREX' });

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({ message: 'A symbol with this name already exists' });
        });

        it('returns 403 when caller is not an admin', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedTokenPayload);

            const response = await request(app)
                .post('/symbols')
                .set('Authorization', `Bearer ${VALID_TOKEN}`)
                .send({ name: 'GER40', category: 'INDICES' });

            expect(response.status).toBe(403);
            expect(symbolService.create).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /symbols/:id', () => {
        it('returns 204 when caller is an admin and deletion succeeds', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedAdminTokenPayload);
            vi.mocked(symbolService.delete).mockResolvedValue({
                id: 1,
                name: 'EUR/USD',
                category: 'FOREX',
                published: true,
            });

            const response = await request(app).delete('/symbols/1').set('Authorization', `Bearer ${VALID_TOKEN}`);

            expect(response.status).toBe(204);
            expect(symbolService.delete).toHaveBeenCalledWith(1);
        });

        it('returns 400 when the symbol still has trades', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedAdminTokenPayload);
            vi.mocked(symbolService.delete).mockRejectedValue(
                ApiError.BadRequest('Cannot delete a symbol that has trades')
            );

            const response = await request(app).delete('/symbols/1').set('Authorization', `Bearer ${VALID_TOKEN}`);

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({ message: 'Cannot delete a symbol that has trades' });
        });

        it('returns 403 when caller is not an admin', async () => {
            vi.mocked(tokenService.validateAccessToken).mockReturnValue(mockedTokenPayload);

            const response = await request(app).delete('/symbols/1').set('Authorization', `Bearer ${VALID_TOKEN}`);

            expect(response.status).toBe(403);
            expect(symbolService.delete).not.toHaveBeenCalled();
        });
    });
});
