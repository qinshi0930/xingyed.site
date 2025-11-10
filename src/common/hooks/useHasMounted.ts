import { useEffect, useState } from "react";

export const useHasMounted = () => {
	const [hasMounted, setHasMounted] = useState<boolean>(false);

	useEffect(() => {
		// eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
		setHasMounted(true);
	}, []);

	return hasMounted;
};

export default useHasMounted;
