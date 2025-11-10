import Giscus from "@giscus/react";

import { useThemeState } from "@/common/stores/theme/theme-provider";

interface GiscusCommentProps {
	isEnableReaction?: boolean;
}

const GiscusComment = ({ isEnableReaction = false }: GiscusCommentProps) => {
	const theme = useThemeState((s) => s.theme);

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
				theme={theme === "dark" ? "transparent_dark" : "light"}
				lang="en"
				loading="lazy"
			/>
		</div>
	);
};

export default GiscusComment;
