import { readFileSync } from 'fs';
import path from 'path';
import { z } from 'zod';

import { ApiError } from '../libs/api-error';

const packageJsonSchema = z.object({ version: z.string() });

const currentVersion = packageJsonSchema.parse(
    JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'))
).version;

const DOCKER_HUB_REPO = 'igorfesyk/trading-journal-server';

const dockerHubTagsResponseSchema = z.object({
    results: z.array(z.object({ name: z.string() })),
});

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
};
