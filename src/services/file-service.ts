import { App, TFile, TFolder, Vault } from "obsidian";
import { Card, Lane } from "../utils/constants";
import { getTagsFromContent, getDueDateFromContent, pickTagColorIndexBasedOnHash } from "../utils/card-content-utils";

/**
 * FileService handles all file system operations using Obsidian's Vault API
 * This replaces the backend API from Tasks.md
 */
export class FileService {
	private vault: Vault;

	constructor(app: App) {
		this.vault = app.vault;
	}

	/**
	 * Get all lanes (directories) in the tasks folder
	 */
	async getLanes(tasksFolderPath: string): Promise<Lane[]> {
		const folder = this.vault.getAbstractFileByPath(tasksFolderPath);

		if (!(folder instanceof TFolder)) {
			return [];
		}

		const lanes: Lane[] = [];

		for (const child of folder.children) {
			if (child instanceof TFolder) {
				lanes.push({
					name: child.name,
					path: child.path,
				});
			}
		}

		return lanes;
	}

	/**
	 * Get all cards (markdown files) in a lane
	 */
	async getCardsInLane(lanePath: string): Promise<Card[]> {
		const folder = this.vault.getAbstractFileByPath(lanePath);

		if (!(folder instanceof TFolder)) {
			return [];
		}

		const cards: Card[] = [];

		for (const child of folder.children) {
			if (child instanceof TFile && child.extension === "md") {
				const content = await this.vault.read(child);
				const tags = getTagsFromContent(content);
				const dueDate = getDueDateFromContent(content);

				cards.push({
					name: child.basename,
					lane: folder.name,
					path: child.path,
					content,
					tags: tags.map(tag => ({
						name: tag,
						backgroundColor: `var(--color-alt-${pickTagColorIndexBasedOnHash(tag)})`,
					})),
					dueDate: dueDate || undefined,
					lastUpdated: new Date(child.stat.mtime),
					createdAt: new Date(child.stat.ctime),
				});
			}
		}

		return cards;
	}

	/**
	 * Get all cards across all lanes
	 */
	async getAllCards(tasksFolderPath: string): Promise<Card[]> {
		const lanes = await this.getLanes(tasksFolderPath);
		const allCards: Card[] = [];

		for (const lane of lanes) {
			const cards = await this.getCardsInLane(lane.path);
			allCards.push(...cards);
		}

		return allCards;
	}

	/**
	 * Create a new lane (directory)
	 */
	async createLane(tasksFolderPath: string, laneName: string): Promise<void> {
		const lanePath = `${tasksFolderPath}/${laneName}`;
		await this.vault.createFolder(lanePath);
	}

	/**
	 * Rename a lane
	 */
	async renameLane(oldPath: string, newName: string): Promise<void> {
		const folder = this.vault.getAbstractFileByPath(oldPath);
		if (folder instanceof TFolder) {
			const newPath = `${folder.parent?.path}/${newName}`;
			await this.vault.rename(folder, newPath);
		}
	}

	/**
	 * Delete a lane
	 */
	async deleteLane(lanePath: string): Promise<void> {
		const folder = this.vault.getAbstractFileByPath(lanePath);
		if (folder instanceof TFolder) {
			await this.vault.delete(folder, true);
		}
	}

	/**
	 * Create a new card (markdown file)
	 */
	async createCard(lanePath: string, cardName: string, content: string = ""): Promise<void> {
		const cardPath = `${lanePath}/${cardName}.md`;
		await this.vault.create(cardPath, content);
	}

	/**
	 * Update card content
	 */
	async updateCardContent(cardPath: string, content: string): Promise<void> {
		const file = this.vault.getAbstractFileByPath(cardPath);
		if (file instanceof TFile) {
			await this.vault.modify(file, content);
		}
	}

	/**
	 * Rename a card
	 */
	async renameCard(oldPath: string, newName: string): Promise<void> {
		const file = this.vault.getAbstractFileByPath(oldPath);
		if (file instanceof TFile) {
			const newPath = `${file.parent?.path}/${newName}.md`;
			await this.vault.rename(file, newPath);
		}
	}

	/**
	 * Move a card to a different lane
	 */
	async moveCard(cardPath: string, newLanePath: string): Promise<void> {
		const file = this.vault.getAbstractFileByPath(cardPath);
		if (file instanceof TFile) {
			const newPath = `${newLanePath}/${file.name}`;
			await this.vault.rename(file, newPath);
		}
	}

	/**
	 * Delete a card
	 */
	async deleteCard(cardPath: string): Promise<void> {
		const file = this.vault.getAbstractFileByPath(cardPath);
		if (file instanceof TFile) {
			await this.vault.delete(file);
		}
	}

	/**
	 * Check if a path exists
	 */
	pathExists(path: string): boolean {
		return this.vault.getAbstractFileByPath(path) !== null;
	}
}
