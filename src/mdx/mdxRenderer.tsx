import MdxEvaluate from "./evaluate";
// import "@/app/styles/mdx.css";

export default function MDARenderer({ source }: { source: string }) {
	// const mdxSource = await serializeMdx(source);
	// return <MdxHydrate {...mdxSource} />;

	return <MdxEvaluate source={source} />;
}
