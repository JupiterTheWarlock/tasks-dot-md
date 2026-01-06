import { ItemView, WorkspaceLeaf } from "obsidian";
import { VIEW_TYPE_BOARD } from "../utils/constants";
import { render } from "solid-js/web";
import App from "./components/App-test.jsx";
import boardCss from "../styles/board.css?inline";

export class BoardView extends ItemView {
	private dispose: (() => void) | null = null;
	private styleEl: HTMLStyleElement;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		this.styleEl = document.createElement("style");
		this.styleEl.textContent = boardCss;
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

	async onOpen() {
		const container = this.containerEl.children[1];
		if (!container) return;

		console.log("BoardView opening...");
		console.log("Container:", container);

		container.empty();
		container.addClass("tasks-dot-md-board");

		// Inject CSS
		this.containerEl.appendChild(this.styleEl);

		console.log("About to render SolidJS app");
		// Render SolidJS app
		this.dispose = render(() => App(), container);
		console.log("SolidJS app rendered");
	}

	async onClose() {
		if (this.dispose) {
			this.dispose();
		}
		this.styleEl.remove();
	}
}
