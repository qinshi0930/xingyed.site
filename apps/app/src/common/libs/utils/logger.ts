// eslint-disable-next-line unused-imports/no-unused-vars
type LogLevel = "log" | "error" | "warn" | "info";

interface Logger {
	log: (...args: any[]) => void;
	error: (...args: any[]) => void;
	warn: (...args: any[]) => void;
	info: (...args: any[]) => void;
}

const isDevelopment = process.env.NODE_ENV === "development";

const logger: Logger = {
	log: (...args: any[]) => {
		if (isDevelopment) {
			console.log(...args);
		}
	},
	error: (...args: any[]) => {
		if (isDevelopment) {
			console.error(...args);
		}
	},
	warn: (...args: any[]) => {
		if (isDevelopment) {
			console.warn(...args);
		}
	},
	info: (...args: any[]) => {
		if (isDevelopment) {
			console.info(...args);
		}
	},
};

export default logger;
