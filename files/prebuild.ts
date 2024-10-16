#!/usr/bin/env node
import fs from 'node:fs/promises';
import { load as loadYaml } from 'js-yaml';

const TARGET_FILE = './static/admin/decap-cms.js';

updateDecapCMS();

let module = '// THESE TYPES WERE AUTOMATICALLY GENERATED\n\ndeclare global {\n';
module += await genAllTypes();
module += '}\n\nexport {};';

module = indent(module);

await fs.writeFile(process.cwd().concat(`/src/decap.d.ts`), module);

async function updateDecapCMS() {
    let isOutdated: boolean;
    try {
        const mtime = (await fs.stat(TARGET_FILE)).mtime.getTime();
        isOutdated = Date.now() - mtime > 86400000;
    } catch {
        isOutdated = true;
    }

    if (isOutdated) {
        const response = await fetch('https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js');
        const content = await response.text();

        await fs.writeFile(TARGET_FILE, content);

        console.log('Decap CMS file updated successfully.');
    } else {
        console.log('Decap CMS file is up to date.');
    }
}

async function genAllTypes(): Promise<string> {
    const config: any = loadYaml(await fs.readFile(process.cwd().concat('/static/admin/config.yml'), { encoding: 'utf-8' }));
    let typedef = '';

    const collections = config.collections;
    collections.forEach((collection) => {
        if (collection.files) {
            collection.files.forEach((file) => {
                typedef += genTypeDef(file.name, file.fields);
            })
        } else if (collection.fields) {
            typedef += genTypeDef(collection.name, collection.fields);
        }
    });
    return typedef;
}

function genTypeDef(collectionName: string, fieldsDesc: any[]): string {
    const fields: any[] = [];
    fieldsDesc.forEach((field) => {
        fields.push(field);
    })
    let typedef = '';
    typedef += `export type ${toTypeName(collectionName)} = `;
    typedef += genType(fields);
    typedef += '\n\n';
    return typedef;
}

function genType(fields: any[]): string {
    let typedef = '{\n';
    fields.forEach(field => {
        typedef += `${field.name}: ${getTypeForField(field)};\n`;
    });
    typedef += '}';
    return typedef;
}

function toTypeName(collectionName: string): string {
    return collectionName.split('_').map((s) => s.substring(0, 1).toUpperCase() + s.substring(1)).join("") + 'Data';
}

function getTypeForField(field: any): string {
    // Map DecapCMS field types to TypeScript types
    switch (field.widget) {
        case 'boolean':
            return 'boolean';
        case 'code':
            return 'string';
        case 'color':
            return 'string';
        case 'datetime':
            return 'string';
        case 'file':
            return 'string';
        case 'hidden':
            return 'string';
        case 'image':
            return 'string';
        // TODO support variable type lists
        case 'list':
            return genType(field.fields) + '[]';
        case 'map':
            return 'string';
        case 'markdown':
            return 'string';
        case 'number':
            return (field.value_type == 'int' || field.value_type == 'float') ? 'number' : 'string';
        case 'object':
            return genType(field.fields);
        case 'relation':
            return toTypeName(field.collection) + (field.multiple ? '[]' : '');
        case 'select':
            if (typeof field.options[0] === 'string') {
                return field.multiple ? 'string' : 'string[]';
            } else {
                return field.multiple ? '{ label: string; value: string }' : '{ label: string; value: string }[]';
            }
        case 'string':
            return 'string';
        case 'text':
            return 'string';
        default:
            return 'any';
    }
}

function indent(script: string): string {
    let indentLevel = 0;
    let out = '';
    for (const line of script.split('\n')) {
        if (line.includes('}')) {
            indentLevel--;
        }

        for (let i = 0; i < indentLevel; i++) {
            out += '    ';
        }
        out += line + '\n';

        if (line.includes('{')) {
            indentLevel++;
        }
    }
    return out;
}
