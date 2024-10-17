import { loadContent } from "$lib/decap/loader";

export async function load() {
    const data: HomeData = await loadContent('post', "9999-01-01-example");
    return data;
}

