import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Standalone output: Next.js bundles only the files needed to run the server.
  // Recommended by fumadocs for Docker deployments.
  output: "standalone",
};

export default withMDX(config);
