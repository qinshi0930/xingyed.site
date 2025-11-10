import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// 初始化 dayjs 插件
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const DEFAULT_TIMEZONE = "Asia/Shanghai";

/**
 * 格式化相对时间
 * @param date 日期字符串或日期对象
 * @param timezone 时区，默认为 'Asia/Shanghai'
 * @returns 格式化后的相对时间字符串
 */
export const formatRelativeTime = (
	date: string | Date,
	timezone: string = `${DEFAULT_TIMEZONE}`,
): string => {
	return dayjs.utc(date).tz(timezone).fromNow();
};

/**
 * 获取指定时区的当前时间
 * @param timezone 时区，默认为 'Asia/Shanghai'
 * @returns 指定时区的当前时间
 */
export const getCurrentTimeInZone = (timezone: string = `${DEFAULT_TIMEZONE}`) => {
	return dayjs().tz(timezone);
};

/**
 * 将日期转换为指定时区
 * @param date 日期字符串或日期对象
 * @param timezone 目标时区，默认为 'Asia/Shanghai'
 * @returns 转换后的 dayjs 对象
 */
export const convertToTimeZone = (
	date: string | Date,
	timezone: string = `${DEFAULT_TIMEZONE}`,
) => {
	return dayjs.utc(date).tz(timezone);
};

export const formatDate = (
	date: string,
	type: string = "MMMM dd, yyyy",
	timezone: string = `${DEFAULT_TIMEZONE}`,
): string => {
	if (!date) {
		return "";
	}
	return dayjs.utc(date).tz(timezone).format(type);
};

/**
 * 计算两个日期之间的持续时间
 * @param startDate 开始日期
 * @param endDate 结束日期，如果不提供则使用当前时间
 * @returns 格式化的持续时间字符串
 */
export const calculateDuration = (startDate: string, endDate?: string | null): string => {
	const durationMonths = dayjs(endDate || Date.now()).diff(dayjs(startDate), "month");
	const durationYears = Math.floor(durationMonths / 12);
	const remainingMonths = durationMonths % 12;

	return `${durationYears > 0 ? `${durationYears} Year${durationYears > 1 ? "s" : ""}, ` : ""}${remainingMonths} Month${remainingMonths > 1 ? "s" : ""}`;
};
