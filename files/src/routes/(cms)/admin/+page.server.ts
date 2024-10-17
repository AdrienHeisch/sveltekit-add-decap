import { loadCollections } from "$lib/decap/loader";

export async function load() {
    const { previewCollections } = await loadCollections();
    return {
        previewCollections
    }
}