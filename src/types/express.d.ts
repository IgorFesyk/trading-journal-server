import { $Enums } from '../generated/prisma/client';

declare global {
    namespace Express {
        interface Request {
            user: {
                id: number;
                email: string;
                name: string;
                role: $Enums.ROLE;
            };
        }
    }
}
