# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **Obsidian plugin that replicates Tasks.md functionality** (kanban board) directly within Obsidian. Unlike typical Obsidian plugins, this project uses **SolidJS** for reactive UI components, making it unique in the Obsidian ecosystem.

**Key architectural difference from standalone Tasks.md:**
- Tasks.md uses a backend (Node.js/Koa) + frontend (SolidJS) with REST API
- This plugin uses Obsidian's Vault API directly, eliminating the need for a backend server
- Lanes = folders in the vault, Cards = markdown files
- All data persists as files in the user's vault, not in a separate database

## Build & Development Commands

```bash
# Install dependencies
npm install

# Development build with hot reload
npm run dev

# Production build (with type checking)
npm run build

# Lint code
npm run lint
```

**Important**: After building, copy `main.js`, `manifest.json`, and `styles.css` to `<vault>/.obsidian/plugins/tasks-dot-md/` to test in Obsidian.

## High-Level Architecture

### The SolidJS + Obsidian Integration Pattern

This plugin uses an unusual architecture where **TypeScript services bridge to JavaScript SolidJS components** via global window objects:

```typescript
// In main.ts - Services are injected globally
window.tasksDotMdFileService = this.fileService;
window.tasksDotMdDataManager = this.dataManager;
window.tasksDotMdSettings = this.settings;
```

```javascript
// In App.jsx - Components access services globally
const fileService = window.tasksDotMdFileService;
const dataManager = window.tasksDotMdDataManager;
```

**Why this pattern?** SolidJS components (.jsx) can't directly import TypeScript classes. The global window object acts as a dependency injection bridge between the Obsidian plugin's TypeScript world and SolidJS's JavaScript world.

### Core Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Obsidian Plugin (main.ts)                                   │
│  - Plugin lifecycle (onload/onunload)                        │
│  - Registers views, commands, settings                      │
│  - Initializes services & injects into window object        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Services Layer (src/services/)                              │
│  - FileService: Wraps Obsidian Vault API for file ops       │
│  - DataManager: Handles plugin data (tags, sort order)      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  View Layer (src/views/)                                     │
│  - BoardView (WorkspaceLeaf): Obsidian's view container     │
│  - App.jsx (SolidJS): Main kanban board component          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Components (src/views/components/)                          │
│  - SolidJS components for lanes, cards, drag-drop, etc.     │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Patterns

**1. FileService (Vault API Abstraction)**
Located in `src/services/file-service.ts`. All file operations go through this class, not direct Vault API calls. This mirrors Tasks.md's REST API structure but uses Obsidian's Vault API instead:
- `getLanes()` → `vault.list()` + filter for folders
- `getCardsInLane()` → `vault.list()` + filter for .md files + `vault.read()`
- `createCard()` → `vault.create()`
- `updateCardContent()` → `vault.modify()`
- `moveCard()` → `vault.rename()`

**2. DataManager (Plugin Data Persistence)**
Located in `src/services/data-manager.ts`. Replaces Tasks.md's config folder (which stored JSON files on disk). Uses Obsidian's plugin data API:
- Tag color mappings → `plugin.loadData()`
- Sort order persistence → `plugin.saveData()`

**3. BoardView (WorkspaceLeaf)**
Located in `src/views/board-view.ts`. Custom Obsidian view type registered with `VIEW_TYPE_BOARD`. Key responsibilities:
- Injects CSS styles into the view
- Mounts SolidJS app using `render()` from `solid-js/web`
- Handles cleanup with dispose callback

**4. Utility Functions (Reused from Tasks.md)**
Located in `src/utils/card-content-utils.js`. These are pure JavaScript functions copied directly from Tasks.md:
- `addTagToContent()`, `removeTagToContent()`
- `getTagsFromContent()`, `getDueDateFromContent()`
- `pickTagColorIndexBasedOnHash()`

## esbuild Configuration

The build setup is configured for SolidJS JSX:

```javascript
// esbuild.config.mjs
jsx: "automatic",
jsxImportSource: "solid-js",
```

**Critical**: TypeScript config also needs:
```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "moduleResolution": "bundler"
  }
}
```

This setup allows esbuild to handle JSX transformation for SolidJS while TypeScript only type-checks.

## Component Structure (SolidJS)

The main `App.jsx` component (inspired by Tasks.md's `App.jsx`) manages:
- **State**: `lanes`, `cards`, `search`, `tagsOptions`, `sort`, `viewMode`
- **Data fetching**: `fetchData()` loads lanes/cards from FileService
- **CRUD operations**: `createNewCard()`, `createNewLane()`, etc.
- **Sorting/filtering**: Computed memos for filtered/sorted cards

**Note**: The current implementation has simplified placeholder components. The full Tasks.md component set includes:
- Drag-and-drop lanes and cards
- Expanded card editor (modal)
- Bulk operations toolbar
- Keyboard navigation (vim-style: h/j/k/l)
- Tag management with color picker
- Due date picker

## Data Flow Example

When a user creates a new card:

```
User clicks "+ Card" in UI
        ↓
App.jsx → createNewCard(lane)
        ↓
window.tasksDotMdFileService.createCard(lanePath, cardName, content)
        ↓
FileService → this.vault.create(cardPath, content)
        ↓
Obsidian writes markdown file to disk
        ↓
fetchData() is called to refresh board
        ↓
FileService reads all lanes/cards again
        ↓
App.jsx state updates → SolidJS re-renders UI
```

## CSS Architecture

Styles are defined in `src/styles/board.css` and imported via `?inline` query param in BoardView:
```typescript
import boardCss from "../styles/board.css?inline";
```

This tells esbuild to inline the CSS as a string, which is then injected into a `<style>` element. CSS variables are mapped to Obsidian's theme variables:
```css
.tasks-dot-md-board {
  --color-accent: var(--interactive-accent);
  --color-foreground: var(--text-normal);
  --color-background-1: var(--background-primary);
  /* ... etc */
}
```

## Common Tasks

### Adding a new SolidJS component

1. Create `.jsx` file in `src/views/components/`
2. Import and use in `App.jsx`
3. Remember: Cannot directly import TypeScript - use window objects for services

### Modifying file operations

1. Update method in `FileService` (src/services/file-service.ts)
2. Call from `App.jsx` via `window.tasksDotMdFileService`
3. Handle errors gracefully (try/catch with console.error)

### Adding new settings

1. Update `PluginSettings` interface in `src/utils/constants.ts`
2. Add to `DEFAULT_SETTINGS`
3. Update UI in `src/settings.ts`
4. Settings are automatically persisted via `loadData()`/`saveData()`

### Debugging SolidJS reactivity

- Use `createEffect()` to log state changes
- Remember SolidJS's tracking: only access signals/properties inside reactive scopes
- If state isn't updating, verify you're not accidentally breaking reactivity by storing signals in non-reactive variables

## Migration Notes (Tasks.md → Obsidian)

**What was adapted:**
- Frontend components (SolidJS) - largely reusable
- Card content parsing utilities - identical
- CSS styles - adapted with Obsidian theme variable mapping

**What was replaced:**
- REST API calls → FileService method calls
- localStorage → DataManager (plugin data API)
- Backend file system operations → Vault API calls
- Router navigation → View state management

**What's missing from current implementation:**
- Drag-and-drop (requires DOM event handling in Obsidian context)
- Stacks-Editor integration (could use Obsidian's CodeMirror instead)
- Image upload (needs Obsidian attachment folder integration)
- Keyboard shortcuts (partially implemented)
- Bulk operations UI
- Theme switching (uses Obsidian theme instead)

## Troubleshooting

**Build fails with JSX errors:**
- Check `esbuild.config.mjs` has `jsx: "automatic"` and `jsxImportSource: "solid-js"`
- Verify `tsconfig.json` has `"jsx": "preserve"` and `"jsxImportSource": "solid-js"`

**Services undefined in components:**
- Ensure `window.tasksDotMdFileService` etc are set in `main.ts` before view opens
- Check that the BoardView exists when accessing globals

**CSS not loading:**
- Verify CSS import uses `?inline` query param
- Check that style element is appended to `this.containerEl` in BoardView

**Plugin doesn't load in Obsidian:**
- Verify `manifest.json` `id` matches folder name
- Check Obsidian developer console (Ctrl+Shift+I) for errors
- Ensure `main.js` exists at plugin root after build

## References

- Tasks.md reference implementation: `Tasks.md/` folder (not included in releases)
- Obsidian API docs: https://docs.obsidian.md
- SolidJS docs: https://www.solidjs.com/docs
- AGENTS.md: General Obsidian plugin development guidelines
