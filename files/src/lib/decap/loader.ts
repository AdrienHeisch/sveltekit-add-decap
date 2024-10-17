import { browser, dev } from '$app/environment';
import { PUBLIC_BACKEND_BRANCH, PUBLIC_GITHUB_REPO, PUBLIC_GITHUB_USER, PUBLIC_WEBSITE_URL } from '$env/static/public';
import { preprocessConfig, type Collection, type RedirectableCollection } from "$lib/decap/utils";
import { Octokit } from "@octokit/core";
import { load as loadYaml } from 'js-yaml';
import fs from 'node:fs/promises';

const CONFIG_PATH = "/admin/config.yml";

type RelationField = {
    name: string;
    collection: string;
};

export const config = {
    value: {
        backend: {
            name: dev ? "test-repo" : "github",
            repo: `${PUBLIC_GITHUB_USER}/${PUBLIC_GITHUB_REPO}`,
            branch: `${PUBLIC_BACKEND_BRANCH}`,
            site_domain: `${PUBLIC_WEBSITE_URL}`,
            base_url: `${PUBLIC_WEBSITE_URL}`,
            auth_endpoint: "/api/auth",
            use_graphql: true,
        },
        local_backend: dev,
        load_config_file: false,
    } as any,
    first_get: true,
    async get() {
        if (this.first_get) {
            let content: string;
            if (browser) {
                content = await (await fetch(CONFIG_PATH)).text();
            } else {
                content = await fs.readFile(process.cwd().concat('/static' + CONFIG_PATH), { encoding: 'utf-8' });
            }
            const configFile: any = loadYaml(content);
            preprocessConfig(configFile);
            for (const key in configFile) {
                this.value[key] = configFile[key];
            }
        }
        return this.value;
    }
};

// TODO maybe find a better way to do this
const relationFieldsMap = {
    value: new Map<string, RelationField[]>(),
    async get() {
        if (this.value.size === 0) {
            const { relationFieldsMap } = await loadCollections();
            this.value = relationFieldsMap;
        }
        return this.value;
    }
}

export async function loadContent(collection: string, slug: string) {
    const path = `${collection}/${slug}`;

    let data;
    if (browser) {
        if (dev) {
            data = await (await fetch(`/__content__/${path}`)).json();
        } else {
            data = await loadFromGithub(path);
        }
    } else {
        const content = await fs.readFile(process.cwd().concat(`/content/${collection}/${slug}.json`), { encoding: 'utf-8' });
        data = JSON.parse(content);
    }

    await handleRelations(collection, data);
    return data;
}

export async function handleRelations(collection: string, data: any) {
    const relationsFields = (await relationFieldsMap.get()).get(collection);
    if (relationsFields) {
        for await (const rel of relationsFields) {
            let slugs = data[rel.name];
            if (Array.isArray(slugs)) {
                data[rel.name] = await Promise.all(
                    slugs.map(
                        async (slug) =>
                            await loadContent(rel.collection, slug),
                    ),
                );
            } else {
                data[rel.name] = slugs = await loadContent(
                    collection,
                    slugs,
                );
            }
        }
    }
}

async function loadFromGithub(path: string) {
    const decapUser = localStorage.getItem('decap-cms-user');
    if (decapUser == null) {
        throw "Not logged in";
    }

    const token = JSON.parse(decapUser).token;
    const octokit = new Octokit({
        auth: token,
    });

    const owner = PUBLIC_GITHUB_USER;
    if (owner == null) { throw 'env GITHUB_USER not set'; }
    const repo = PUBLIC_GITHUB_REPO;
    if (repo == null) { throw 'env GITHUB_REPO not set'; }
    const branch = PUBLIC_BACKEND_BRANCH;
    if (branch == null) { throw 'env PUBLIC_BACKEND_BRANCH not set'; }

    const response = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
            owner,
            repo,
            ref: branch,
            path: `content/${path}.json`,
            headers: {
                "X-GitHub-Api-Version": "2022-11-28",
            },
        }
    );

    return JSON.parse(
        // @ts-ignore
        atob(response.data.content)
    );
}

export async function loadCollections() {
    const collections: Collection[] = (await config.get()).collections;

    const out = {
        relationFieldsMap: new Map<string, RelationField[]>(),
        previewCollections: new Array<RedirectableCollection>()
    };

    collections.forEach((collection) => {
        const fields: RelationField[] = [];
        if (collection.files) {
            collection.files.forEach((file) => {
                file.fields.forEach((field) => {
                    if (field.widget === 'relation' && field.value_field === '{{slug}}') {
                        fields.push({ name: field.name, collection: field.collection });
                    }
                })
                if (fields.length > 0) {
                    out.relationFieldsMap.set(file.name, fields);
                }
                out.previewCollections.push({ name: collection.name, redirect: file.name });
            })
        } else if (collection.fields) {
            collection.fields?.forEach((field) => {
                if (field.widget === 'relation' && field.value_field === '{{slug}}') {
                    fields.push({ name: field.name, collection: field.collection });
                }
            })
            if (fields.length > 0) {
                out.relationFieldsMap.set(collection.name, fields);
            }
            out.previewCollections.push({ name: collection.name });
        }
    });

    return out;
}
