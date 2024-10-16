import { loadContent } from "$lib/decapLoader";

export async function load() {
    const data: PostData = await loadContent('post', "9999-01-01-example");
    return data;
}

