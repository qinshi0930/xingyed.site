"use client";

import { useEffect, useState } from "react";
import { useWindowSize } from "usehooks-ts";

const useIsMobile = () => {
	const [isMobile, setIsMobile] = useState(false);
	const { width } = useWindowSize();

	useEffect(() => {
		const handler = setTimeout(() => {
			setIsMobile(width < 1024);
		}, 150);

		return () => {
			clearTimeout(handler);
		};
	}, [width]);

	return isMobile;
};

export default useIsMobile;
