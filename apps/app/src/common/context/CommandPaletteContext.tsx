import type { ReactNode } from "react";

import React, { createContext, useMemo, useState } from "react";

interface CommandPaletteContextType {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
}

export const CommandPaletteContext = createContext<CommandPaletteContextType>({
	isOpen: false,
	setIsOpen: () => {},
});

interface CommandPaletteProviderProps {
	children: ReactNode;
}

export const CommandPaletteProvider = ({ children }: CommandPaletteProviderProps) => {
	const [isOpen, setOpen] = useState(false);

	const setIsOpen = (open: boolean) => {
		setOpen(open);
	};

	const contextValue = useMemo(() => ({ isOpen, setIsOpen }), [isOpen]);
	return <CommandPaletteContext value={contextValue}>{children}</CommandPaletteContext>;
};
