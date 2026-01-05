import axios from "axios";
import jwt from "jsonwebtoken";

import { GITHUB_ACCOUNTS } from "@/common/constant/github";

const GITHUB_USER_ENDPOINT = "https://api.github.com/graphql";

const GITHUB_USER_QUERY = `query($username: String!) {
  user(login: $username) {
    contributionsCollection {
      contributionCalendar {
        colors
        totalContributions
        months {
          firstDay
          name
          totalWeeks
        }
        weeks {
          contributionDays {
            color
            contributionCount
            date
          }
          firstDay
        }
      }
    }
  }
}`;

export const fetchGithubData = async (username: string, token: string | undefined) => {
	const response = await axios.post(
		GITHUB_USER_ENDPOINT,
		{
			query: GITHUB_USER_QUERY,
			variables: {
				username,
			},
		},
		{
			headers: {
				Authorization: `bearer ${token}`,
			},
		},
	);

	const status: number = response.status;
	const responseJson = response.data;

	if (status > 400) {
		return { status, data: {} };
	}

	return { status, data: responseJson.data.user };
};

export const getGithubUser = async (type: string) => {
	const account = GITHUB_ACCOUNTS.find((account) => account?.type === type && account?.is_active);

	if (!account) {
		throw new Error("Invalid user type");
	}

	const { username } = account;
	const token = await getInstallationToken();
	return await fetchGithubData(username, token);
};

const GITHUB_APP = {
	appId: process.env.GITHUB_APP_ID as string,
	privateKey: process.env.GITHUB_APP_PEM_KEY_BASE64 as string,
	installationId: process.env.GITHUB_APP_INSTALLATION_ID as string,
};

function generateAppJwt(): string {
	const payload = {
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000 + 10 * 60),
		iss: GITHUB_APP.appId,
	};
	return jwt.sign(payload, Buffer.from(GITHUB_APP.privateKey, "base64"), { algorithm: "RS256" });
}

let installationToken = {
	token: "",
	expiresAt: Date.now(),
};

async function getInstallationToken(): Promise<string> {
	const now = Date.now();

	if (installationToken.expiresAt - now > 5 * 60 * 1000) {
		console.log(`read cached token`);
		return installationToken.token;
	}

	const jwt = generateAppJwt();
	const res = await fetch(
		`https://api.github.com/app/installations/${GITHUB_APP.installationId}/access_tokens`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${jwt}`,
				Accept: "application/vnd.github.v3+json",
			},
		},
	);

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Github App token error ${res.status}: ${text}`);
	}

	const data: { token: string; expires_at: string } = await res.json();
	installationToken = {
		token: data.token,
		expiresAt: new Date(data.expires_at).getTime(),
	};

	return data.token;
}
