import { loadCollections } from "$lib/decapLoader";

export async function load() {
    const { previewCollections } = await loadCollections();
    return {
        previewCollections
    }
}