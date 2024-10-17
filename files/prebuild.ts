#!/usr/bin/env node
import { load as loadYaml } from 'js-yaml';
import fs from 'node:fs/promises';
import { addDefaultContent, genTypedefModule, preprocessConfig } from './src/lib/decapUtils';

const DECAP_JS_FILE = './static/admin/decap-cms.js';

await main();

async function main() {
    updateDecapCMS();

    const config: any = loadYaml(await fs.readFile(process.cwd().concat('/static/admin/config.yml'), { encoding: 'utf-8' }));
    preprocessConfig(config);
    await addDefaultContent(config);

    const module = genTypedefModule(config);
    await fs.writeFile(process.cwd().concat(`/src/decap.d.ts`), module);
    // await fs.mkdir('/.svelte-kit/types/decap/');
    // await fs.writeFile(process.cwd().concat(`/.svelte-kit/types/decap/decap.d.ts`), module);
}

async function updateDecapCMS() {
    let isOutdated: boolean;
    try {
        const mtime = (await fs.stat(DECAP_JS_FILE)).mtime.getTime();
        isOutdated = Date.now() - mtime > 86400000;
    } catch {
        isOutdated = true;
    }

    if (isOutdated) {
        const response = await fetch('https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js');
        const content = await response.text();

        await fs.writeFile(DECAP_JS_FILE, content);

        console.log('Decap CMS file updated successfully.');
    } else {
        console.log('Decap CMS file is up to date.');
    }
}