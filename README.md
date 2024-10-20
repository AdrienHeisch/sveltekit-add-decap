# SvelteKit + DecapCMS

This repo can help you setup a SvelteKit project with DecapCMS. It will download and update Decap, register custom previews for your component and generate Typescript type definitions for your collections. Your SvelteKit configuration will be updated to use @sveltejs/adapter-static.

This is some pretty rough tooling, I am no expert in NodeJS and the like.

## Installation

The following command will download and execute the install.sh script from this repository. Please review the script before running it.

```bash
curl -fsSL https://raw.githubusercontent.com/AdrienHeisch/sveltekit-add-decap/master/install.sh | bash
```

## Usage

Once the install is complete, you will have to update the .env file with the relevant information.

In your repository, you will find :
- ./content/post : a placeholder Decap collection
- ./prebuild.ts : will be run before the dev and build script of your package.json.
- ./src/app.css : placeholder css file that is imported elsewhere, in case you would want to add Tailwind later for example
- ./src/lib/decap/loader.ts : export the loadContent function. see ./src/routes/(app)/+page.server.ts
- ./src/lib/components/Post.svelte : placeholder component
- ./src/routes/+layout.ts : default layout with prerendering
- ./src/routes/(app)/+layout.svelte : imports ./src/app.css
- ./src/routes/(app)/+page.server.ts : example use of loadContent
- ./src/routes/(app)/+page.svelte : example use of data from Decap
- ./src/routes/(cms)/content/...path/+server.ts : handles local use of Decap with the vite dev server
- ./src/routes/(cms)/preview/+layout.svelte : imports ./src/app.css
- ./src/routes/(cms)/preview/+page.svelte : displays a preview of a component with data passed from ./src/routes/(cms)/admin/+page.svelte. One limitation is that components that should be rendered in previews can only be located in $lib, and be nested at a maximum depth of 10 directory (you can increase that in this file).
- ./src/routes/(cms)/admin/+server.svelte : loads collections from Decap
- ./src/routes/(cms)/admin/+page.svelte : route to the Decap admin panel, contains the code for initializing Decap and registering a preview for each collection.
- ./static/admin/config.yml : the Decap configuration file, with a placeholder collection. The backend configuration is in ./src/routes/(cms)/admin/+page.svelte
- ./static/media/uploads : some placeholder media content
- ./static/404.html : a 404 error page, needed with some hosts

To register a new collection :
- Add it to ./static/admin/config.yml, please refer to the [official documentation](https://decapcms.org/docs/intro/)
- Every collection you want to register a preview for should have a field based on the following model, with default being set to the path of the component relative to ./src/ :
```yaml
{ label: "Layout", name: "layout", widget: "hidden", default: "lib/Post" }
```
- For any field with widget: "relation", if you set value_field: "{{slug}}", previews and type generation will properly insert the content of the related item.
- A new Typescript type definition will be generated in ./src/decap.d.ts when you run the dev server, build your website or simply run the ./prebuild.ts script
- For a folder collection, create a new item (from the interface or manually) for your collection at the path you indicated, which must be within the ./content directory. You should always set default values to avoid having "undefined" all over the place in the preview when an item is created.
- For file collections, a new json file will be created using the default values from the fields, or default values according to the fields' types. You can remove it to generate it again if needed.
- Create a component at the path you indicated in the layout field of your collection, for example ./src/lib/components/Post.svelte
The generated type can be used as a single prop object for your component, with all fields properly typed.

## Non standard Decap feature

- For any field with widget: "object", if you set collection: "name_of_a_collection", it will be replaced with the fields of the collection using this name (only folder collections are supported).

## Cloudflare Pages

In my experience Cloudflare is a host for a fully static website based on a GitHub repo. It can even let you authenticate into Github OAuth using Pages functions. See [this repo](https://github.com/i40west/netlify-cms-cloudflare-pages) for more information on setting it up.

Enjoy !
