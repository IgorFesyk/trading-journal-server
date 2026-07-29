import { readFileSync } from 'fs';
import path from 'path';
import { z } from 'zod';

import { env } from '../env';
import { ApiError } from '../libs/api-error';

const packageJsonSchema = z.object({ version: z.string() });

const currentVersion = packageJsonSchema.parse(
    JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'))
).version;

const DOCKER_HUB_REPO = 'igorfesyk/trading-journal-server';
const CLIENT_GITHUB_REPO = 'IgorFesyk/trading-journal-client';

const dockerHubTagsResponseSchema = z.object({
    results: z.array(z.object({ name: z.string() })),
});

const clientVersionResponseSchema = z.object({ version: z.string() });
const githubReleasesResponseSchema = z.array(z.object({ tag_name: z.string() }));

export const versionService = {
    getCurrent() {
        return currentVersion;
    },

    async getAllAvailable() {
        const response = await fetch(`https://hub.docker.com/v2/repositories/${DOCKER_HUB_REPO}/tags/?page_size=100`);

        if (!response.ok) {
            throw new ApiError(502, 'Failed to fetch versions from Docker Hub');
        }

        const data = dockerHubTagsResponseSchema.parse(await response.json());

        return data.results.map((tag) => tag.name).filter((name) => name !== 'latest');
    },

    async getClientCurrent() {
        const response = await fetch(`${env.CLIENT_URL}/version.json`);

        if (!response.ok) {
            throw new ApiError(502, 'Failed to fetch current client version');
        }

        const data = clientVersionResponseSchema.parse(await response.json());

        return data.version;
    },

    async getClientAllAvailable() {
        const response = await fetch(`https://api.github.com/repos/${CLIENT_GITHUB_REPO}/releases?per_page=100`, {
            headers: {
                Accept: 'application/vnd.github+json',
                'User-Agent': 'trading-journal-server',
            },
        });

        if (!response.ok) {
            throw new ApiError(502, 'Failed to fetch versions from GitHub');
        }

        const data = githubReleasesResponseSchema.parse(await response.json());
        return data.map((release) => release.tag_name.replace(/^v/, ''));
    },
};
