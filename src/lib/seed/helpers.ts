import { faker } from "@faker-js/faker";

export function generateRandomImage(w = 800, h = 600) {
	return faker.image.urlPicsumPhotos({
		width: w,
		height: h,
		blur: 0,
	});
	// return `https://picsum.photos/${width}/${height}?random${Math.random() * 1000}`;
}

export function generateParagraphs(count = 3) {
	return Array.from({ length: count })
		.fill("")
		.map(() => faker.lorem.paragraph())
		.join("\n\n");
}

export function generateCodeBlock() {
	const languages = ["javascript", "typescript", "css", "html"];

	const language = faker.helpers.arrayElement(languages);
	const code = faker.lorem.sentences(3);

	return `\`\`\`${language}\n${code}\n\`\`\``;
}
