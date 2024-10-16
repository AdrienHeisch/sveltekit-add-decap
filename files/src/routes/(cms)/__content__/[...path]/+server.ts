import { dev } from '$app/environment';
import { error, json } from '@sveltejs/kit';
import { readdir } from 'fs/promises';

export async function entries() {
    if (!dev) {
        return [{ path: "_" }];
    }

    const contentDirectory = process.cwd().concat("/content/");
    const paths = (await readdir(contentDirectory, { recursive: true, withFileTypes: true }))
        .filter((entry) => !entry.isDirectory())
        .map((entry) => {
            return { path: `${entry.parentPath}/${entry.name}`.split("/content/")[1].split(".")[0] };
        });

    return paths;
}

export async function GET({ params }) {
    if (!dev) {
        return json('?');
    }

    const { path } = params;

    const filePath = process.cwd().concat(`/content/${path}.json`);

    try {
        const content = await Bun.file(filePath).text();
        const data = JSON.parse(content);
        return json(data);
    } catch (_) {
        return error(404, 'Not found');
    }
}

export const prerender = true;