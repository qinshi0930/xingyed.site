import { faker } from "@faker-js/faker";

import { generateCodeBlock, generateParagraphs, generateRandomImage } from "../helpers";

export interface ProjectSchema {
	id: string;
	title: string;
	abstract: string;
	slug: string;
	tags: string[];
	cover: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

function generateMarkdownFile() {
	const allTags = ["react", "node.js", "next.js", "hono.js", "tailwindcss"];

	const item: ProjectSchema = {
		id: faker.string.uuid(),
		title: faker.lorem.sentence(),
		abstract: faker.lorem.paragraph(),
		slug: faker.lorem.slug(),
		cover: generateRandomImage(),
		content: "",
		tags: faker.helpers.arrayElements(allTags, { min: 1, max: 3 }),
		createdAt: faker.date.past().toISOString().split("T")[0],
		updatedAt: faker.date.past().toISOString().split("T")[0],
	};

	const content = `---
title: "${item.title}"
date: "${item.createdAt}"
---
::: warning
warning
:::

::: danger
danger
:::

::: info
info
:::

::: tip
tip
:::

::: note
note
:::

::: details
details
:::

# ${item.title}

![Random Image](${item.cover})

${generateParagraphs(2)}

## 子标题

${generateParagraphs(1)}

![Another Random Image](${generateRandomImage(600, 400)})

${generateCodeBlock()}

${generateParagraphs(1)}
`;

	item.content = content;
	return item;
}

export async function generateMultipleMarkdownFiles(count = 5) {
	const projects: ProjectSchema[] = [];
	// 生成文件
	for (let i = 0; i < count; i++) {
		projects.push(generateMarkdownFile());
	}
	return projects;
}
