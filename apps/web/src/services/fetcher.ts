import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const fetcher = (url: string) => {
	const fullUrl = url.startsWith("http") ? url : `${API_URL}${url}`;
	return axios.get(fullUrl).then((response) => response.data);
};
