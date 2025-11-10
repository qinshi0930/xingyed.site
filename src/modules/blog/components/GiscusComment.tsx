import Giscus from "@giscus/react";
import { useTheme } from "next-themes";

interface GiscusCommentProps {
	isEnableReaction?: boolean;
}

const GiscusComment = ({ isEnableReaction = false }: GiscusCommentProps) => {
	const { resolvedTheme } = useTheme();

	return (
		<div className="mb-2 mt-5">
			<Giscus
				repo="aulianza/aulianza.id"
				repoId="R_kgDOJoIhfQ"
				category="General"
				categoryId="DIC_kwDOJoIhfc4CW6cJ"
				mapping="pathname"
				reactionsEnabled={isEnableReaction ? "1" : "0"}
				emitMetadata="1"
				inputPosition="top"
				theme={resolvedTheme === "dark" ? "transparent_dark" : "light"}
				lang="en"
				loading="lazy"
			/>
		</div>
	);
};

export default GiscusComment;
