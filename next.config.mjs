let userConfig = undefined;
try {
   userConfig = await import("./v0-user-next.config");
} catch (e) {
   // ignore error
}

import fs from "fs";
import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
   eslint: {
      ignoreDuringBuilds: true,
   },
   typescript: {
      ignoreBuildErrors: true,
   },
   images: {
      unoptimized: true,
   },
   experimental: {
      webpackBuildWorker: true,
      parallelServerBuildTraces: true,
      parallelServerCompiles: true,
      // Only enable HTTPS if certificates exist
      ...(fs.existsSync("./certificates/cert.pem") &&
      fs.existsSync("./certificates/key.pem")
         ? {
              https: {
                 key: fs.readFileSync("./certificates/key.pem"),
                 cert: fs.readFileSync("./certificates/cert.pem"),
              },
           }
         : {}),
   },
   webpack: (config, { isServer }) => {
      // Fixes npm packages that depend on node modules
      config.resolve.fallback = {
         ...config.resolve.fallback,
         fs: false,
         path: false,
         os: false,
         crypto: false,
         stream: false,
         buffer: false,
         util: false,
         encoding: false,
      };

      // Solve problems with face-api.js and other browser-based libraries
      if (!isServer) {
         config.resolve.alias = {
            ...config.resolve.alias,
         };

         // Handle specific issues with face-api.js
         config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            path: false,
            perf_hooks: false,
            canvas: false,
         };

         // Ensure we use the correct version of sharp
         config.externals = [...(config.externals || []), "sharp"];
      }

      return config;
   },
   // Add header to allow camera access in development
   async headers() {
      return [
         {
            source: "/(.*)",
            headers: [
               {
                  key: "Permissions-Policy",
                  value: "camera=self, microphone=self",
               },
            ],
         },
      ];
   },
};

mergeConfig(nextConfig, userConfig);

function mergeConfig(nextConfig, userConfig) {
   if (!userConfig) {
      return;
   }

   for (const key in userConfig) {
      if (
         typeof nextConfig[key] === "object" &&
         !Array.isArray(nextConfig[key])
      ) {
         nextConfig[key] = {
            ...nextConfig[key],
            ...userConfig[key],
         };
      } else {
         nextConfig[key] = userConfig[key];
      }
   }
}

export default nextConfig;
