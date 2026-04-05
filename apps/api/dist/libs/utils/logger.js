"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isDevelopment = process.env.NODE_ENV === "development";
const logger = {
    log: (...args) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },
    error: (...args) => {
        if (isDevelopment) {
            console.error(...args);
        }
    },
    warn: (...args) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },
    info: (...args) => {
        if (isDevelopment) {
            console.info(...args);
        }
    },
};
exports.default = logger;
