"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDuration = exports.formatDate = exports.convertToTimeZone = exports.getCurrentTimeInZone = exports.formatRelativeTime = void 0;
const dayjs_1 = __importDefault(require("dayjs"));
const relativeTime_1 = __importDefault(require("dayjs/plugin/relativeTime"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
// 初始化 dayjs 插件
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
dayjs_1.default.extend(relativeTime_1.default);
const DEFAULT_TIMEZONE = "Asia/Shanghai";
/**
 * 格式化相对时间
 * @param date 日期字符串或日期对象
 * @param timezone 时区，默认为 'Asia/Shanghai'
 * @returns 格式化后的相对时间字符串
 */
const formatRelativeTime = (date, timezone = `${DEFAULT_TIMEZONE}`) => {
    return dayjs_1.default.utc(date).tz(timezone).fromNow();
};
exports.formatRelativeTime = formatRelativeTime;
/**
 * 获取指定时区的当前时间
 * @param timezone 时区，默认为 'Asia/Shanghai'
 * @returns 指定时区的当前时间
 */
const getCurrentTimeInZone = (timezone = `${DEFAULT_TIMEZONE}`) => {
    return (0, dayjs_1.default)().tz(timezone);
};
exports.getCurrentTimeInZone = getCurrentTimeInZone;
/**
 * 将日期转换为指定时区
 * @param date 日期字符串或日期对象
 * @param timezone 目标时区，默认为 'Asia/Shanghai'
 * @returns 转换后的 dayjs 对象
 */
const convertToTimeZone = (date, timezone = `${DEFAULT_TIMEZONE}`) => {
    return dayjs_1.default.utc(date).tz(timezone);
};
exports.convertToTimeZone = convertToTimeZone;
const formatDate = (date, type = "dddd, MMM DD, YYYY", timezone = `${DEFAULT_TIMEZONE}`) => {
    if (!date) {
        return "";
    }
    return dayjs_1.default.utc(date).tz(timezone).format(type);
};
exports.formatDate = formatDate;
/**
 * 计算两个日期之间的持续时间
 * @param startDate 开始日期
 * @param endDate 结束日期，如果不提供则使用当前时间
 * @returns 格式化的持续时间字符串
 */
const calculateDuration = (startDate, endDate) => {
    const durationMonths = (0, dayjs_1.default)(endDate || Date.now()).diff((0, dayjs_1.default)(startDate), "month");
    const durationYears = Math.floor(durationMonths / 12);
    const remainingMonths = durationMonths % 12;
    return `${durationYears > 0 ? `${durationYears} Year${durationYears > 1 ? "s" : ""}, ` : ""}${remainingMonths} Month${remainingMonths > 1 ? "s" : ""}`;
};
exports.calculateDuration = calculateDuration;
