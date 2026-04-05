"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGithubUser = exports.fetchGithubData = void 0;
const axios_1 = __importDefault(require("axios"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const github_1 = require("@/common/constant/github");
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
const fetchGithubData = async (username, token) => {
    const response = await axios_1.default.post(GITHUB_USER_ENDPOINT, {
        query: GITHUB_USER_QUERY,
        variables: {
            username,
        },
    }, {
        headers: {
            Authorization: `bearer ${token}`,
        },
    });
    const status = response.status;
    const responseJson = response.data;
    if (status > 400) {
        return { status, data: {} };
    }
    return { status, data: responseJson.data.user };
};
exports.fetchGithubData = fetchGithubData;
const getGithubUser = async (type) => {
    const account = github_1.GITHUB_ACCOUNTS.find((account) => account?.type === type && account?.is_active);
    if (!account) {
        throw new Error("Invalid user type");
    }
    const { username } = account;
    const token = await getInstallationToken();
    return await (0, exports.fetchGithubData)(username, token);
};
exports.getGithubUser = getGithubUser;
const GITHUB_APP = {
    appId: process.env.GITHUB_APP_ID,
    privateKey: process.env.GITHUB_APP_PEM_KEY_BASE64,
    installationId: process.env.GITHUB_APP_INSTALLATION_ID,
};
function generateAppJwt() {
    const payload = {
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000 + 10 * 60),
        iss: GITHUB_APP.appId,
    };
    return jsonwebtoken_1.default.sign(payload, Buffer.from(GITHUB_APP.privateKey, "base64"), { algorithm: "RS256" });
}
let installationToken = {
    token: "",
    expiresAt: Date.now(),
};
async function getInstallationToken() {
    const now = Date.now();
    if (installationToken.expiresAt - now > 5 * 60 * 1000) {
        console.log(`read cached token`);
        return installationToken.token;
    }
    const jwt = generateAppJwt();
    const res = await fetch(`https://api.github.com/app/installations/${GITHUB_APP.installationId}/access_tokens`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${jwt}`,
            Accept: "application/vnd.github.v3+json",
        },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Github App token error ${res.status}: ${text}`);
    }
    const data = await res.json();
    installationToken = {
        token: data.token,
        expiresAt: new Date(data.expires_at).getTime(),
    };
    return data.token;
}
