import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";

import prisma from "@/prisma/prisma";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	plugins: [nextCookies(), username({ minUsernameLength: 8, maxUsernameLength: 32 })],
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
		},
	},
});

auth.api.signInUsername({
	body: {
		username: "test",
		password: "",
		rememberMe: true,
		callbackURL: "",
	},
});
