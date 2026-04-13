import { docs } from "@/.source";
import { loader } from "fumadocs-core/source";

// Version bridge: fumadocs-mdx@11 ships files as a lazy fn at runtime even
// though fumadocs-core@15 types Source.files as VirtualFile[] (an array).
// Cast through unknown→fn to call it, then reassemble with the resolved array.
const mdxSource = docs.toFumadocsSource();
const resolvedFiles = (
  mdxSource.files as unknown as () => typeof mdxSource.files
)();

export const source = loader({
  // baseUrl is "/" because basePath="/docs" is handled by Next.js config.
  // Page tree links become /work, /incidents, etc.; browser sees /docs/work, /docs/incidents.
  baseUrl: "/",
  source: { ...mdxSource, files: resolvedFiles },
});
