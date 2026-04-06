module.exports = [
"[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/.worktrees/monorepo-api-isomorphic-migration/apps/app/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "build/chunks/2c82a__pnpm_efdedba0._.js",
  "build/chunks/[root-of-the-server]__bcc9e95c._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/.worktrees/monorepo-api-isomorphic-migration/apps/app/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];