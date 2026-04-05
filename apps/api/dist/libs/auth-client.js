"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signOut = exports.signIn = exports.useSession = exports.authClient = void 0;
const plugins_1 = require("better-auth/client/plugins");
const react_1 = require("better-auth/react");
exports.authClient = (0, react_1.createAuthClient)({
    baseURL: process.env.BETTER_AUTH_URL,
    plugins: [(0, plugins_1.usernameClient)()],
});
exports.useSession = exports.authClient.useSession, exports.signIn = exports.authClient.signIn, exports.signOut = exports.authClient.signOut;
