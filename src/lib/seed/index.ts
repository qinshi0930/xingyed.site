import fs from "fs-extra/esm";
import path from "node:path";

import { generateRandomBlogPosts } from "./generators/blog";
import { generateMultipleMarkdownFiles } from "./generators/projects";

const dataDir = path.join(__dirname, "data");

const dataDirMap = {
	blogs: path.join(dataDir, "blogs.json"),
	projects: path.join(dataDir, "projects.json"),
};

const cleanUp = async () => {
	await Promise.all(
		Object.values(dataDirMap).map(async (filePath) => {
			await fs.remove(filePath);
		}),
	);
};

const seed = async () => {
	try {
		await fs.ensureDir(dataDir);

		await cleanUp();

		const blogs = await generateRandomBlogPosts(10);
		await fs.writeJSON(dataDirMap.blogs, blogs, { spaces: 2 });
		console.log("Blogs data generated. save to: ", dataDirMap.blogs);

		const projects = await generateMultipleMarkdownFiles(5);
		await fs.writeJSON(dataDirMap.projects, projects, { spaces: 2 });
		console.log("Projects data generated. save to: ", dataDirMap.projects);

		console.log("\n All seed data generated successfully!");
	} catch (error) {
		console.error("Error generating seed data: ", error);
	}
};

if (require.main === module) {
	seed();
}

export { seed };
