import { isNil } from "lodash";

export function toTitleCase(str: string | undefined) {
	if (isNil(str)) return;

	return str.replace(/\b\w+('\w)?/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
	});
}
