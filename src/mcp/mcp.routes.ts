import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Request, Response, Router } from 'express';

import { authMiddleware } from '../middlewares/auth.middleware';
import { createMcpServer } from './mcp.server';

const router: Router = Router();

router.post('/', authMiddleware, async (req: Request, res: Response) => {
    const server = createMcpServer(req.user.id);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    res.on('close', () => {
        transport.close();
        server.close();
    });
});

export default router;
