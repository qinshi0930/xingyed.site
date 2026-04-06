export const formatBlogSlug = (slug: string) => slug?.slice(0, -5);

export const removeHtmlTags = (html: string) => {
	if (typeof DOMParser !== "undefined") {
		const doc = new DOMParser().parseFromString(html, "text/html");
		return doc.body.textContent || "";
	} else {
		return html;
	}
};

export const formatExcerpt = (content: string, maxLength = 100) => {
	const cleanedContent = removeHtmlTags(content);

	if (cleanedContent.length <= maxLength) {
		return cleanedContent;
	}

	const trimmed = cleanedContent.substring(0, maxLength).replace(/\s+\S*$/, "");

	return trimmed + (cleanedContent.length > maxLength ? "..." : "");
};

export const calculateReadingTime = (content: string, wordsPerMinute = 5) => {
	const cleanedContent = formatExcerpt(content);
	const readingTimeMinutes = Math.ceil(cleanedContent.split(/\s+/).length / wordsPerMinute);
	return readingTimeMinutes;
};
