"use client";
import type { SerializeOptions } from "cookie";

import { getCookie, setCookie } from "cookies-next/client";
import { useEffect } from "react";

import { useThemeState } from "./theme-provider";

const defaultCookieOptions: SerializeOptions = {
	path: "/",
	maxAge: 30 * 24 * 3600, // 一个月后过期
};

export function ThemeBridge() {
	const localTheme = useThemeState((s) => s.theme);
	const setTheme = useThemeState((s) => s.setTheme);

	useEffect(() => {
		const initialTheme = async () => {
			const cookieTheme = getCookie("theme");
			const defaultTheme = "light";

			console.log(
				`theme bridge initialize: localTheme=${localTheme} cookieTheme=${cookieTheme} defaultTheme=${defaultTheme}`,
			);
			// 若 localStorage 中有主题，但 cookie 未同步，则写入 cookie
			if (localTheme && localTheme !== cookieTheme) {
				setCookie("theme", localTheme, defaultCookieOptions);
			}

			// 若两边都无主题，则初始化为 defaultTheme
			if (!localTheme && !cookieTheme) {
				setTheme(defaultTheme);
				setCookie("theme", defaultTheme, defaultCookieOptions);
			}
		};

		initialTheme();
	}, []);

	useEffect(() => {
		setCookie("theme", localTheme, defaultCookieOptions);
	}, [localTheme]);

	return null;
}
