import { Plugin, TFile } from "obsidian";
import { TagColorMapping, SortOrderMapping } from "../utils/constants";

/**
 * DataManager handles plugin data persistence
 * Replaces the config/ folder from Tasks.md
 */
export class DataManager {
	private plugin: Plugin;
	private tagColors: TagColorMapping = {};
	private sortOrder: SortOrderMapping = {};

	constructor(plugin: Plugin) {
		this.plugin = plugin;
	}

	async load() {
		const data = await this.plugin.loadData();
		if (data) {
			this.tagColors = data.tagColors || {};
			this.sortOrder = data.sortOrder || {};
		}
	}

	async save() {
		await this.plugin.saveData({
			tagColors: this.tagColors,
			sortOrder: this.sortOrder,
		});
	}

	/**
	 * Get tag colors for a specific path
	 */
	getTagColors(path: string): Record<string, string> {
		return this.tagColors[path] || {};
	}

	/**
	 * Set tag color for a specific path
	 */
	async setTagColor(path: string, tag: string, color: string): Promise<void> {
		if (!this.tagColors[path]) {
			this.tagColors[path] = {};
		}
		this.tagColors[path][tag] = color;
		await this.save();
	}

	/**
	 * Remove tag color
	 */
	async removeTagColor(path: string, tag: string): Promise<void> {
		if (this.tagColors[path]) {
			delete this.tagColors[path][tag];
			await this.save();
		}
	}

	/**
	 * Get sort order for a board
	 */
	getSortOrder(boardPath: string): Record<string, string[]> {
		return this.sortOrder[boardPath] || {};
	}

	/**
	 * Set sort order for a lane in a board
	 */
	async setSortOrder(boardPath: string, laneName: string, cardNames: string[]): Promise<void> {
		if (!this.sortOrder[boardPath]) {
			this.sortOrder[boardPath] = {};
		}
		this.sortOrder[boardPath][laneName] = cardNames;
		await this.save();
	}

	/**
	 * Clear sort order for a lane
	 */
	async clearSortOrder(boardPath: string, laneName: string): Promise<void> {
		if (this.sortOrder[boardPath]) {
			delete this.sortOrder[boardPath][laneName];
			await this.save();
		}
	}
}
