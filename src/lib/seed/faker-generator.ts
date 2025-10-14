// 导入 faker
import { faker } from "@faker-js/faker";

// 定义博客文章的接口
interface BlogPost {
	id: string;
	title: string;
	content: string;
	author: string;
	publishDate: Date;
	category: string;
	tags: string[];
	readTimeMinutes: number; // 阅读时长（分钟）
	isPublished: boolean;
	slug: string; // URL 友好标题
}

/**
 * 生成指定数量的随机博客文章
 * @param count 要生成的博客文章数量
 * @returns 包含随机博客文章的数组
 */
function generateRandomBlogPosts(count: number): BlogPost[] {
	// 确保 count 是有效的正整数
	if (count <= 0) {
		return [];
	}

	const blogPosts: BlogPost[] = [];

	for (let i = 0; i < count; i++) {
		// 生成文章id
		const id = faker.string.uuid();

		// 生成一个标题
		const title = faker.lorem.sentence(faker.number.int(7)); // 5到7个单词的句子作为标题

		// 生成内容，使用多个段落
		const content = faker.lorem.paragraphs(faker.number.int({ min: 3, max: 8 }));

		// 生成作者姓名
		const author = faker.person.fullName();

		// 生成发布日期，在过去2年内随机选择
		const publishDate = faker.date.between({
			from: "2023-01-01T00:00:00.000Z",
			to: new Date().toISOString(),
		});

		// 从预定义的类别中随机选择
		const categories = [
			"Technology",
			"Lifestyle",
			"Travel",
			"Food",
			"Health",
			"Business",
			"Science",
			"Art",
			"Sports",
			"Education",
		];
		const category = faker.helpers.arrayElement(categories);

		// 生成1-3个随机标签
		const tags = faker.helpers.arrayElements(
			[
				"javascript",
				"typescript",
				"react",
				"nodejs",
				"webdev",
				"programming",
				"travel",
				"foodie",
				"fitness",
				"design",
				"startup",
				"ai",
				"machine learning",
				"photography",
				"books",
				"music",
				"coding",
				"tutorial",
				"guide",
			],
			{ min: 1, max: 2 },
		);

		// 基于内容长度估算阅读时间（每200词约1分钟）
		const wordCount = content.split(" ").length;
		const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

		// 随机决定是否已发布
		const isPublished = faker.datatype.boolean(0.8); // 80% 概率已发布

		// 生成URL友好的slug
		const slug = faker.helpers.slugify(title).toLowerCase();

		// 构建博客文章对象
		const blogPost: BlogPost = {
			id, // 简单的递增ID
			title,
			content,
			author,
			publishDate,
			category,
			tags,
			readTimeMinutes,
			isPublished,
			slug,
		};

		blogPosts.push(blogPost);
	}

	return blogPosts;
}

export { generateRandomBlogPosts };
export type { BlogPost };
