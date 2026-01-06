/**
 * Constants for the Tasks.md Obsidian plugin
 */

export const VIEW_TYPE_BOARD = "tasks-dot-md-board";
export const ICON_NAME = "layout-list";

export type ViewMode = "extended" | "regular" | "compact" | "tight";
export type Theme = "adwaita" | "nord" | "catppuccin";

export const DEFAULT_SETTINGS = {
	tasksFolderPath: "tasks",
	enableKeyboardShortcuts: true,
	defaultViewMode: "regular" as ViewMode,
	theme: "adwaita" as Theme,
};

export interface PluginSettings {
	tasksFolderPath: string;
	enableKeyboardShortcuts: boolean;
	defaultViewMode: ViewMode;
	theme: Theme;
}

export interface Lane {
	name: string;
	path: string;
}

export interface Card {
	name: string;
	lane: string;
	path: string;
	content: string;
	tags: Array<{
		name: string;
		backgroundColor: string;
	}>;
	dueDate?: string;
	lastUpdated: Date;
	createdAt: Date;
}

export interface TagColorMapping {
	[key: string]: {
		[tag: string]: string;
	};
}

export interface SortOrderMapping {
	[key: string]: {
		[laneName: string]: string[];
	};
}
