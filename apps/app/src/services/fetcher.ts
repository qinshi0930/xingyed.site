import axios from "axios";

export const fetcher = (url: string) => {
	// 使用相对路径,同域请求
	return axios.get(url).then((response) => response.data);
};
