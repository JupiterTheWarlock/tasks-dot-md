import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import { VIEW_TYPE_BOARD } from "../utils/constants";

export class BoardView extends ItemView {
	async onOpen() {
		const container = this.containerEl.children[1];
		if (!container) return;

		container.empty();
		container.addClass("tasks-dot-md-board");

		// Check if services are available
		if (!window.tasksDotMdFileService || !window.tasksDotMdSettings) {
			container.innerHTML = `
				<div style="padding: 20px; color: var(--text-normal);">
					<h1>Tasks.md Plugin</h1>
					<p style="color: var(--text-error);">Error: Services not loaded</p>
				</div>
			`;
			return;
		}

		try {
			// Fetch lanes and cards
			const folderPath = window.tasksDotMdSettings.tasksFolderPath || "tasks";
			const lanes = await window.tasksDotMdFileService.getLanes(folderPath);
			const allCards = await window.tasksDotMdFileService.getAllCards(folderPath);

			console.log("Lanes:", lanes);
			console.log("Cards:", allCards);

			// Build board HTML
			let lanesHtml = '';

			for (const lane of lanes) {
				const laneCards = allCards.filter(card => card.lane === lane.name);
				let cardsHtml = '';

				for (const card of laneCards) {
					// Extract tags
					const tagsHtml = card.tags && card.tags.length > 0
						? card.tags.map(tag =>
							`<span class="tag" style="background-color: ${tag.backgroundColor}; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${tag.name}</span>`
						  ).join(' ')
						: '';

					// Content preview
					const contentPreview = card.content
						? `<div style="margin-top: 8px; font-size: 0.9em; opacity: 0.8;">${card.content.substring(0, 100)}${card.content.length > 100 ? '...' : ''}</div>`
						: '';

					cardsHtml += `
						<div class="card" data-card-path="${card.path}" style="
							background: var(--background-secondary);
							border: 1px solid var(--background-modifier-border);
							border-radius: 6px;
							padding: 12px;
							margin-bottom: 8px;
							cursor: pointer;
						">
							<div style="font-weight: 500;">${card.name}</div>
							${tagsHtml ? `<div style="margin-top: 8px;">${tagsHtml}</div>` : ''}
							${contentPreview}
						</div>
					`;
				}

				lanesHtml += `
					<div class="lane" style="
						min-width: 300px;
						max-width: 300px;
						margin-right: 20px;
						display: flex;
						flex-direction: column;
					">
						<div class="lane-header" style="
							padding: 12px;
							background: var(--background-primary);
							border: 1px solid var(--background-modifier-border);
							border-radius: 6px;
							margin-bottom: 12px;
							font-weight: 600;
						">
							${lane.name} (${laneCards.length})
							<button data-action="create-card" data-lane="${lane.path}" style="
								float: right;
								padding: 4px 8px;
								font-size: 12px;
							">+ Card</button>
						</div>
						<div class="lane-content" style="
							background: var(--background-primary);
							border: 1px solid var(--background-modifier-border);
							border-radius: 6px;
							padding: 12px;
							min-height: 200px;
						">
							${cardsHtml || '<div style="opacity: 0.5; text-align: center; padding: 20px;">No cards</div>'}
						</div>
					</div>
				`;
			}

			container.innerHTML = `
				<div style="
					height: 100%;
					display: flex;
					flex-direction: column;
					background: var(--background-primary);
					color: var(--text-normal);
				">
					<div class="board-header" style="
						padding: 16px;
						background: var(--background-secondary);
						border-bottom: 1px solid var(--background-modifier-border);
					">
						<h1 style="margin: 0; font-size: 1.5em;">Tasks.md Board</h1>
						<p style="margin: 8px 0 0 0; opacity: 0.7;">Folder: ${folderPath}</p>
						<button id="create-lane-btn" style="margin-top: 8px;">+ New Lane</button>
					</div>
					<div class="board-content" style="
						flex: 1;
						overflow-x: auto;
						padding: 20px;
						display: flex;
					">
						${lanesHtml || '<div style="opacity: 0.5; padding: 20px;">No lanes found. Create a lane to get started!</div>'}
					</div>
				</div>
			`;

			// Add event listeners for cards
			container.querySelectorAll('.card').forEach(cardEl => {
				cardEl.addEventListener('click', async () => {
					const cardPath = cardEl.getAttribute('data-card-path');
					if (cardPath && window.tasksDotMdFileService) {
						const file = this.app.vault.getAbstractFileByPath(cardPath);
						if (file) {
							// Open in new leaf
							this.app.workspace.openLinkText(file.path, file.path, true);
						}
					}
				});
			});

			// Add event listener for create lane button
			const createLaneBtn = container.querySelector('#create-lane-btn');
			if (createLaneBtn) {
				createLaneBtn.addEventListener('click', async () => {
					const laneName = await this.promptForLaneName();
					if (laneName && window.tasksDotMdFileService) {
						try {
							await window.tasksDotMdFileService.createLane(folderPath, laneName);
							new Notice(`Created lane: ${laneName}`);
							// Refresh view
							this.onOpen();
						} catch (error) {
							new Notice(`Failed to create lane: ${error}`);
						}
					}
				});
			}

			// Add event listeners for create card buttons
			container.querySelectorAll('[data-action="create-card"]').forEach(btn => {
				btn.addEventListener('click', async (e) => {
					e.stopPropagation();
					const lanePath = btn.getAttribute('data-lane');
					if (lanePath && window.tasksDotMdFileService) {
						const cardName = await this.promptForCardName();
						if (cardName) {
							try {
								await window.tasksDotMdFileService.createCard(lanePath, cardName, `# ${cardName}\n\nCreate your task here...`);
								new Notice(`Created card: ${cardName}`);
								// Refresh view
								this.onOpen();
							} catch (error) {
								new Notice(`Failed to create card: ${error}`);
							}
						}
					}
				});
			});

		} catch (error) {
			console.error("Error loading board:", error);
			container.innerHTML = `
				<div style="padding: 20px; color: var(--text-normal);">
					<h1>Tasks.md Plugin</h1>
					<p style="color: var(--text-error);">Error loading board: ${error}</p>
				</div>
			`;
		}
	}

	async promptForLaneName(): Promise<string | null> {
		const laneName = prompt("Enter lane name:");
		return laneName && laneName.trim() ? laneName.trim() : null;
	}

	async promptForCardName(): Promise<string | null> {
		const cardName = prompt("Enter card name:");
		return cardName && cardName.trim() ? cardName.trim() : null;
	}

	async onClose() {
		// Cleanup
	}

	getViewType(): string {
		return VIEW_TYPE_BOARD;
	}

	getDisplayText(): string {
		return "Tasks.md Board";
	}

	getIcon(): string {
		return "layout-list";
	}
}
