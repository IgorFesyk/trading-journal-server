import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { tradeService } from '../services/trade.service';

export function createMcpServer(userId: number) {
    const server = new McpServer({ name: 'trading-journal', version: '1.0.0' });

    server.registerTool(
        'list_trades',
        {
            title: 'Returns all trades of an account',
            description: 'A tool to fetch all trades of an account by passed accountId',
            inputSchema: { accountId: z.number() },
        },
        async ({ accountId }) => {
            const result = await tradeService.findByAccount(accountId, userId);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        }
    );

    return server;
}
