import { App, PluginSettingTab, Setting } from "obsidian";
import TasksDotMdPlugin from "./main";
import { DEFAULT_SETTINGS, PluginSettings } from "./utils/constants";

export class TasksDotMdSettingTab extends PluginSettingTab {
	plugin: TasksDotMdPlugin;

	constructor(app: App, plugin: TasksDotMdPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Tasks.md for Obsidian Settings" });

		new Setting(containerEl)
			.setName("Tasks folder path")
			.setDesc("The folder containing your task boards (relative to vault root)")
			.addText((text) =>
				text
					.setPlaceholder("tasks")
					.setValue(this.plugin.settings.tasksFolderPath)
					.onChange(async (value) => {
						this.plugin.settings.tasksFolderPath = value || "tasks";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Enable keyboard shortcuts")
			.setDesc("Enable vim-style keyboard navigation (h/j/k/l)")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableKeyboardShortcuts)
					.onChange(async (value) => {
						this.plugin.settings.enableKeyboardShortcuts = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Default view mode")
			.setDesc("Default card display mode")
			.addDropdown((dropdown) =>
				dropdown
					.addOption("regular", "Regular")
					.addOption("extended", "Extended")
					.addOption("compact", "Compact")
					.addOption("tight", "Tight")
					.setValue(this.plugin.settings.defaultViewMode)
					.onChange(async (value) => {
						this.plugin.settings.defaultViewMode = value as any;
						await this.plugin.saveSettings();
					})
			);
	}
}
