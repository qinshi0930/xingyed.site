import { MENU_ITEMS } from "@/common/constant/menu";

import Menu from "./Menu";

const Navigation = () => {
	const filteredMenu = MENU_ITEMS?.filter((item) => item?.isShow);

	return <Menu list={filteredMenu} />;
};

export default Navigation;
