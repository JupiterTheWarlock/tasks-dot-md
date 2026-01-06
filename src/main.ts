import { Plugin, Notice, TFile, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_BOARD, DEFAULT_SETTINGS, PluginSettings } from "./utils/constants";
import { BoardView } from "./views/simple-board";
import { FileService } from "./services/file-service";
import { DataManager } from "./services/data-manager";
import { TasksDotMdSettingTab } from "./settings";

// Extend Window interface to include our services
declare global {
	interface Window {
		tasksDotMdFileService?: FileService;
		tasksDotMdDataManager?: DataManager;
		tasksDotMdSettings?: PluginSettings;
	}
}

export default class TasksDotMdPlugin extends Plugin {
	settings: PluginSettings;
	fileService: FileService;
	dataManager: DataManager;

	async onload() {
		console.log("Loading Tasks.md for Obsidian");

		// Load settings
		await this.loadSettings();

		// Initialize services
		this.fileService = new FileService(this.app);
		this.dataManager = new DataManager(this);
		await this.dataManager.load();

		// Make services globally available for SolidJS components
		window.tasksDotMdFileService = this.fileService;
		window.tasksDotMdDataManager = this.dataManager;
		window.tasksDotMdSettings = this.settings;

		// Register the board view
		this.registerView(
			VIEW_TYPE_BOARD,
			(leaf) => new BoardView(leaf)
		);

		// Add ribbon icon to open the board
		this.addRibbonIcon("layout-list", "Open Tasks.md Board", () => {
			this.activateBoardView();
		});

		// Add command to open the board
		this.addCommand({
			id: "open-tasks-dot-md-board",
			name: "Open Tasks.md Board",
			callback: () => {
				this.activateBoardView();
			},
		});

		// Add settings tab
		this.addSettingTab(new TasksDotMdSettingTab(this.app, this));

		// Watch for file changes to refresh the board
		this.registerEvent(
			this.app.vault.on("modify", async (file) => {
				// Only refresh if it's a markdown file in the tasks folder
				if (file instanceof TFile && file.path.startsWith(this.settings.tasksFolderPath) && file.extension === "md") {
					// Trigger refresh in open board views
					this.app.workspace.getLeavesOfType(VIEW_TYPE_BOARD).forEach(leaf => {
						if (leaf.view instanceof BoardView) {
							// Force refresh by re-rendering
							const container = leaf.view.containerEl.children[1];
							if (container) {
								container.empty();
								// The SolidJS app will be re-mounted on next render
							}
						}
					});
				}
			})
		);

		// Create default tasks folder if it doesn't exist
		const tasksFolder = this.app.vault.getAbstractFileByPath(this.settings.tasksFolderPath);
		if (!tasksFolder) {
			try {
				await this.app.vault.createFolder(this.settings.tasksFolderPath);
				new Notice(`Created "${this.settings.tasksFolderPath}" folder`);
			} catch (error) {
				// Folder might have been created by another process, ignore error
				console.log("Tasks folder creation skipped (might already exist):", error);
			}
		}
	}

	async onunload() {
		// Clean up global references
		delete window.tasksDotMdFileService;
		delete window.tasksDotMdDataManager;
		delete window.tasksDotMdSettings;
	}

	async activateBoardView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null | undefined = workspace.getLeavesOfType(VIEW_TYPE_BOARD)[0];

		if (!leaf) {
			leaf = workspace.getRightLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: VIEW_TYPE_BOARD, active: true });
			}
		}

		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Update global reference
		window.tasksDotMdSettings = this.settings;
	}
}
