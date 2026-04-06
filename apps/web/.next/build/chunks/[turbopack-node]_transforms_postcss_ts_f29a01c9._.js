module.exports = [
"[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/.worktrees/monorepo-migration/apps/web/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "build/chunks/28324__pnpm_015ad72a._.js",
  "build/chunks/[root-of-the-server]__23553f82._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts { CONFIG => \"[project]/.worktrees/monorepo-migration/apps/web/postcss.config.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];