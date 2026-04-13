import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Standalone output: Next.js bundles only the files needed to run the server.
  // Recommended by fumadocs for Docker deployments.
  output: "standalone",
  // Serve docs under /docs path on the main domain (dcs.karetechsolutions.com/docs)
  // instead of a separate subdomain. All Next.js assets get the /docs prefix.
  basePath: "/docs",
};

export default withMDX(config);
