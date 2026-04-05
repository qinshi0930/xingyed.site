import MdxEvaluate from "./evaluate";
import MdxHydrate from "./hydrate";
import { serializeMdx } from "./serialize";

interface Props {
	source: string;
	isClient?: boolean;
}
export default async function MDARenderer({ source, isClient = false }: Props) {
	if (isClient) {
		const mdxSource = await serializeMdx(source);
		return <MdxHydrate {...mdxSource} />;
	}

	return <MdxEvaluate source={source} />;
}
