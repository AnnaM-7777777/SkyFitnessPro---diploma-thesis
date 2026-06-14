/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: "standalone",
    generateEtags: false,
    skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
