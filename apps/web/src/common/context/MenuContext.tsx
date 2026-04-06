import { createContext } from "react";

interface MenuContextType {
	hideNavbar: () => void;
}

export const MenuContext = createContext<MenuContextType>({
	hideNavbar: () => {},
});
