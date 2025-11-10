import fs from "node:fs";
import path from "node:path";

export const getSource = async (filename: string): Promise<string | undefined> => {
	const sourcePath = path.join(process.cwd(), "src", "lib", "seed", "data", filename);
	if (!fs.existsSync(sourcePath)) {
		console.error("the file is not exists, path: ", sourcePath);
		return;
	}
	try {
		return await fs.promises.readFile(sourcePath, "utf8");
	} catch (error) {
		console.error("Error reading file:", error);
	}
};

export const getSourceSync = (filename: string): string | undefined => {
	const sourcePath = path.join(process.cwd(), "src", "lib", "seed", "data", filename);
	if (!fs.existsSync(sourcePath)) return;
	try {
		return fs.readFileSync(sourcePath, "utf8");
	} catch (error) {
		console.error("Error reading file:", error);
	}
};
