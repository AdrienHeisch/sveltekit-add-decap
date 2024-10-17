<script lang="ts">
    import { config, handleRelations } from "../../../lib/decapLoader.js";
    import { onMount } from "svelte";

    export let data;

    onMount(() => {
        // @ts-ignore
        const { CMS } = window;

        config.get().then(config => {
            CMS.init({ config });

            data.previewCollections.forEach((collection) =>
                CMS.registerPreviewTemplate(
                    collection.redirect ? collection.redirect : collection.name,
                    SvelteKitPreview,
                ),
            );
        });

        function SvelteKitPreview({ entry }: { entry: Map<string, any> }) {
            const host = window.location.host;
            const protocol = host.startsWith("localhost") ? "http" : "https";

            let collectionName: string = entry.get("collection");
            const collectionRedirect = data.previewCollections.find(
                (collection) => collection.name === collectionName,
            )?.redirect;
            if (collectionRedirect) {
                collectionName = collectionRedirect;
            }

            const layout: string = entry.get("data").get("layout");
            const previewUrl = `${protocol}://${host}/__preview__?path=${encodeURIComponent(layout)}`;

            let ref: HTMLIFrameElement;

            const sendData = async () => {
                const data = entry.get("data").toJS();
                await handleRelations(collectionName, data);
                ref?.contentWindow?.postMessage(data, previewUrl);
            };

            setTimeout(() => sendData(), 0);

            return (
                // @ts-ignore
                h("iframe", {
                    onLoad: sendData,
                    ref: (el: HTMLIFrameElement) => {
                        ref = el;
                    },
                    src: previewUrl,
                    style: {
                        width: "100%",
                        height: "calc(100vh - 25px)",
                        border: "1px solid #eee",
                    },
                })
            );
        }
    });
</script>

<svelte:head>
    <meta name="robots" content="noindex" />
    <title>Content Manager</title>
</svelte:head>

{@html `
    <script>window.CMS_MANUAL_INIT = true</script>
    <script src="./decap-cms.js"></script>
`}
