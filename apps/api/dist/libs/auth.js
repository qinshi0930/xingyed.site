"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const next_js_1 = require("better-auth/next-js");
const plugins_1 = require("better-auth/plugins");
exports.auth = (0, better_auth_1.betterAuth)({
    plugins: [(0, next_js_1.nextCookies)(), (0, plugins_1.username)({ minUsernameLength: 8, maxUsernameLength: 32 })],
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
    },
});
