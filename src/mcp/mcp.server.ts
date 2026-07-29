import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { CATEGORY } from '../generated/prisma/enums';
import { accountService } from '../services/account.service';
import { symbolService } from '../services/symbol.service';
import { tradeService } from '../services/trade.service';
import { transactionService } from '../services/transaction.service';

export function createMcpServer(userId: number) {
    const server = new McpServer({ name: 'trading-journal', version: '1.0.0' });

    server.registerTool(
        'list_accounts',
        {
            title: 'Lists the user’s trading accounts',
            description: 'A tool to fetch all trading accounts belonging to the authenticated user',
            inputSchema: {},
        },
        async () => {
            const result = await accountService.findByUserId(userId);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        }
    );

    server.registerTool(
        'get_account_stats',
        {
            title: 'Returns performance stats for an account',
            description:
                'A tool to fetch aggregate trade stats (win rate, PnL, breakevens, in-progress count) for an account by passed accountId',
            inputSchema: { accountId: z.number() },
        },
        async ({ accountId }) => {
            const result = await accountService.getAccountStats(accountId, userId);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        }
    );

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

    server.registerTool(
        'get_trade',
        {
            title: 'Returns a single trade',
            description: 'A tool to fetch one trade by its id and the id of the account it belongs to',
            inputSchema: { id: z.number(), accountId: z.number() },
        },
        async ({ id, accountId }) => {
            const result = await tradeService.findById(id, accountId, userId);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        }
    );

    server.registerTool(
        'list_transactions',
        {
            title: 'Returns all transactions of an account',
            description: 'A tool to fetch all deposit/withdrawal transactions of an account by passed accountId',
            inputSchema: { accountId: z.number() },
        },
        async ({ accountId }) => {
            const result = await transactionService.findByAccount(accountId, userId);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        }
    );

    server.registerTool(
        'list_symbols',
        {
            title: 'Lists the shared trading symbols',
            description: 'A tool to fetch the shared list of trading symbols, optionally filtered by category',
            inputSchema: { category: z.enum(CATEGORY).optional() },
        },
        async ({ category }) => {
            const result = await symbolService.findAll(category);
            return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        }
    );

    return server;
}
