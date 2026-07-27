import { OAuth2Client } from 'google-auth-library';

import { env } from '../env';
import { ApiError } from '../libs/api-error';

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const googleService = {
    async verifyIdToken(idToken: string) {
        const ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();

        if (!payload || !payload.email || !payload.email_verified) {
            throw ApiError.UnauthorizedError();
        }

        return { googleId: payload.sub, email: payload.email, name: payload.name ?? payload.email };
    },
};
