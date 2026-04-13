import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Standalone output bundles only the files needed to run the server,
  // enabling a minimal Docker image without copying all of node_modules.
  output: "standalone",
};

export default withMDX(config);
