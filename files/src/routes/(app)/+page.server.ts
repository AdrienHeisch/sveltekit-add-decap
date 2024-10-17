import { loadContent } from "$lib/decap/loader";

export async function load() {
    const data: HomeData = await loadContent('pages', "home");
    return data;
}

