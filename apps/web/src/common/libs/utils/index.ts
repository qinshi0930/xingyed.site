/******************************************************/

export function getRandomNumber(min: number, max: number): number {
	min = Math.max(0, min);
	const randomFraction = Math.random();
	const randomNumber = Math.floor(randomFraction * (max - min + 1)) + min;
	return randomNumber;
}

/******************************************************/

/**
 * 延迟函数，用于创建一个指定毫秒数的延迟
 * @param ms - 延迟的毫秒数
 * @returns - 返回一个Promise对象，在指定毫秒数后resolve
 */
export function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/******************************************************/
/**
 * 将字符串转换为标题格式（每个单词首字母大写，其余字母小写）
 * @param str - 需要转换的字符串，可以是undefined
 * @returns 转换后的标题格式字符串，如果输入为undefined则返回undefined
 */
export function toTitleCase(str: string | undefined) {
	if (!str) return;
	return str.replace(/\b\w+('\w)?/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
	});
}

/******************************************************/

/**
 * 将字符串中最后一个点号替换为破折号
 * @param str 输入的字符串
 * @returns 处理后的字符串，如果原字符串中没有点号则返回原字符串
 */
export function replaceLastDotWithDash(str: string): string {
	const lastDotIndex = str.lastIndexOf(".");
	if (lastDotIndex !== -1) {
		return `${str.slice(0, lastDotIndex)}-${str.slice(lastDotIndex + 1)}`;
	}
	return str;
}

/******************************************************/

/**
 * 将字符串中最后一个破折号（-）替换为点（.）
 * @param str 输入的字符串
 * @returns 处理后的字符串，如果输入字符串中没有破折号则返回原字符串
 */
export function replaceLastDashWithDot(str: string): string {
	const lastDotIndex = str.lastIndexOf("-");
	if (lastDotIndex !== -1) {
		return `${str.slice(0, lastDotIndex)}.${str.slice(lastDotIndex + 1)}`;
	}
	return str;
}
