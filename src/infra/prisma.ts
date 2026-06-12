import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { env } from '../env';
import { PrismaClient } from '../generated/prisma/client';

const pool = new Pool({ connectionString: env.POSTGRES_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
