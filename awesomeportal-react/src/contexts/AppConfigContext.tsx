import React from "react";
// add import for CategoryRule type
import { CategoryRule } from "../utils/assetCategorizer";

export type AppConfigContextType = {
	// ...existing properties...
	// add optional categoryRules so components can read appConfig?.categoryRules
	categoryRules?: CategoryRule[];
};

// ensure the context is typed using the updated AppConfigContextType
export const AppConfigContext = React.createContext<AppConfigContextType | null>(null);