import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Request, Response, Router } from 'express';

import { mcpController } from '../controllers/mcp.controller';
import { createMcpServer } from '../mcp/mcp.server';
import { authMiddleware } from '../middlewares/auth.middleware';
import { mcpAuthMiddleware } from '../middlewares/mcp-auth.middleware';

const router: Router = Router();

router.get('/token', authMiddleware, mcpController.getTokenStatus);
router.post('/token', authMiddleware, mcpController.generateToken);
router.delete('/token', authMiddleware, mcpController.revokeToken);

router.post('/', mcpAuthMiddleware, async (req: Request, res: Response) => {
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
