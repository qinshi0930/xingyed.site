"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.postChatPrompt = void 0;
const axios_1 = __importDefault(require("axios"));
const OPENAI_URL = "https://api.openai.com/v1/completions";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const postChatPrompt = async (prompt) => {
    const response = await axios_1.default.post(OPENAI_URL, {
        model: "text-davinci-003",
        max_tokens: 1000,
        temperature: 0,
        prompt: `${prompt}. answer briefly`,
    }, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
    });
    const status = response?.status;
    if (status >= 400) {
        return {
            status,
            message: response?.statusText,
        };
    }
    const data = response.data;
    return {
        status,
        data,
    };
};
exports.postChatPrompt = postChatPrompt;
const sendMessage = async (prompt) => {
    try {
        const response = await axios_1.default.post("/api/chat", {
            prompt,
        });
        const data = response.data;
        return data?.reply;
        // eslint-disable-next-line unused-imports/no-unused-vars
    }
    catch (error) {
        return "";
    }
};
exports.sendMessage = sendMessage;
