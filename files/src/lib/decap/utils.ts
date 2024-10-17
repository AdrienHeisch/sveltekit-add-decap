import fs from 'node:fs/promises';

export type Field = {
    widget: string;
    value_field: string;
    name: string;
    collection: string;
    fields: any[];
    multiple: boolean;
};

export type File = {
    name: string,
    file: string,
    fields: Field[]
};

export type Collection = {
    name: string,
    files?: File[],
    fields?: Field[]
};

export type RedirectableCollection = {
    name: string;
    redirect?: string;
};

export function preprocessConfig(config: any) {
    const collections: Collection[] = config.collections;
    collections.forEach((collection) => {
        if (collection.files) {
            collection.files.forEach(file => {
                file.fields.map(field => preprocessField(field, config));
            });
        } else if (collection.fields) {
            collection.fields.map(field => preprocessField(field, config));
        }
    });
}

function preprocessField(field: any, config: any) {
    if (field.widget == "object" && !field.fields && field.collection) {
        const model = config.collections.find((collection: Collection) => collection.name == field.collection);
        if (!model) {
            throw "Invalid collection used as object model";
        }
        field.fields = model.fields;
    }
    return field;
}

export async function addDefaultContent(config: any) {
    const collections: Collection[] = config.collections;
    collections.forEach((collection) => {
        if (collection.files) {
            collection.files.forEach(async (file) => {
                if (!file.file) {
                    console.log(`File ${collection.name}.${file.name} is missing a file property`);
                    return;
                }

                let current_content: any;
                try {
                    current_content = await fs.readFile(file.file, { encoding: 'utf-8' });
                } catch (error) {
                    console.log(error)
                }
                if (current_content) {
                    current_content = JSON.parse(current_content);
                }

                let content = "{";
                let firstLine = true;
                file.fields.forEach(field => {
                    if (!firstLine) {
                        content += ",";
                    }
                    const value = getFieldValue(field, current_content);
                    if (field.widget === "object") {
                        content += `\n"${field.name}": ${value}`;
                    } else {
                        content += `\n"${field.name}": "${value}"`;
                    }
                    firstLine = false;
                });
                content += "\n}";
                content = indent(content);
                await fs.writeFile(file.file, content);
            })
        }
    })
}

function getFieldValue(field: Field, current_content: any, recursion = false): any {
    if (current_content && current_content[field.name]) {
        if (typeof current_content[field.name] === "object") {
            const value: any = {};
            if (field.fields) {
                for (const field_ of field.fields) {
                    value[field_.name] = getFieldValue(field_, current_content[field.name], true);
                }
            }
            return recursion ? value : JSON.stringify(value, null, 1).split('\n').map(line => line.trim()).join('\n');
        } else {
            return current_content[field.name];
        }
    } else {
        return getFieldDefaultValue(field, recursion);
    }
}

export function genTypedefModule(config: any): string {
    let module = '// THESE TYPES WERE AUTOMATICALLY GENERATED\n\ndeclare global {\n';
    module += genAllTypes(config);
    module += '}\n\nexport {};';
    module = indent(module);
    return module;
}

function genAllTypes(config: any): string {
    let typedef = '';

    const collections: Collection[] = config.collections;
    collections.forEach((collection) => {
        if (collection.files) {
            collection.files.forEach((file) => {
                typedef += genTypeDef(file.name, file.fields);
            });
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
        case 'list':
            return genType(field.fields) + '[]';
        case 'map':
            return 'string';
        case 'markdown':
            return 'string';
        case 'number':
            return (field.value_type == 'int' || field.value_type == 'float') ? 'number' : 'string';
        case 'object':
            return field.collection ? toTypeName(field.collection) : genType(field.fields);
        case 'relation':
            return toTypeName(field.collection) + (field.multiple ? '[]' : '');
        case 'select':
            if (typeof field.options[0] === 'string') {
                return 'string' + (field.multiple ? '[]' : '');
            } else {
                return '{ label: string; value: string }' + (field.multiple ? '[]' : '');
            }
        case 'string':
            return 'string';
        case 'text':
            return 'string';
        default:
            return 'any';
    }
}

function getFieldDefaultValue(field: any, recursion = false) {
    if (field.default) {
        return field.default;
    }

    switch (field.widget) {
        case 'boolean':
            return field.required ? false : null;
        case 'code':
            return "";
        case 'color':
            return "";
        case 'datetime':
            return "";
        case 'file':
            return "";
        case 'hidden':
            return "";
        case 'image':
            return "";
        case 'list':
            return '[]';
        case 'map':
            return "";
        case 'markdown':
            return "";
        case 'number':
            return (field.value_type == 'int' || field.value_type == 'float') ? 0 : "";
        case 'object':
            const def: any = {};
            for (const f of field.fields) {
                const fdef = getFieldDefaultValue(f, true);
                def[f.name] = fdef;
            }
            return recursion ? def : JSON.stringify(def, null, 1).split('\n').map(line => line.trim()).join('\n');
        case 'relation':
            return field.multiple ? [] : null;
        case 'select':
            if (typeof field.options[0] === 'string') {
                return field.multiple ? "" : [];
            } else {
                return field.multiple ? null : [];
            }
        case 'string':
            return "";
        case 'text':
            return "";
        default:
            return null;
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
