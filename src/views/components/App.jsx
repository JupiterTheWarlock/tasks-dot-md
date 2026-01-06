import {
  createSignal,
  For,
  Show,
  onMount,
  createMemo,
  createEffect,
} from "solid-js";
import { pickTagColorIndexBasedOnHash, getTagsFromContent } from "../../utils/card-content-utils.js";

// Simple placeholders for components - we'll implement them step by step
function Header(props) {
  return (
    <header class="header">
      <input
        type="text"
        placeholder="Search..."
        value={props.search}
        onInput={(e) => props.onSearchChange(e.target.value)}
        class="search-input"
      />
      <button onClick={props.onNewLaneBtnClick}>+ New Lane</button>
    </header>
  );
}

function Card(props) {
  return (
    <div
      class="card"
      data-card-id={props.name}
      onClick={props.onClick}
      tabIndex={0}
    >
      <div class="card__header">
        <span class="card__name">{props.name}</span>
        {props.headerSlot}
      </div>
      <Show when={props.tags && props.tags.length > 0}>
        <div class="card__tags">
          <For each={props.tags}>
            {(tag) => (
              <span
                class="tag"
                style={{ "background-color": tag.backgroundColor }}
              >
                {tag.name}
              </span>
            )}
          </For>
        </div>
      </Show>
      <Show when={props.content}>
        <div class="card__content">{props.content.slice(0, 100)}...</div>
      </Show>
    </div>
  );
}

function LaneName(props) {
  return (
    <div class="lane-name">
      <span>{props.name}</span>
      <span class="lane-count">({props.count})</span>
      <button onClick={props.onRenameBtnClick}>Rename</button>
      <button onClick={props.onCreateNewCardBtnClick}>+ Card</button>
    </div>
  );
}

// Simple drag-drop container placeholder
function DragContainer(props) {
  return <div class={props.class}>{props.children}</div>;
}

export default function App() {
  // Core state
  const [lanes, setLanes] = createSignal([]);
  const [cards, setCards] = createSignal([]);
  const [search, setSearch] = createSignal("");
  const [tagsOptions, setTagsOptions] = createSignal([]);
  const [selectedCard, setSelectedCard] = createSignal(null);
  const [focusedCardId, setFocusedCardId] = createSignal(null);

  // View state
  const [viewMode, setViewMode] = createSignal("regular");
  const [sort, setSort] = createSignal("none");
  const [sortDirection, setSortDirection] = createSignal("asc");

  // Get FileService from global (injected by main.ts)
  const fileService = window.tasksDotMdFileService;
  const dataManager = window.tasksDotMdDataManager;
  const settings = window.tasksDotMdSettings;

  // Fetch data from vault
  async function fetchData() {
    if (!fileService || !settings) return;

    try {
      const folderPath = settings.tasksFolderPath || "tasks";

      // Get lanes
      const lanesData = await fileService.getLanes(folderPath);
      const laneNames = lanesData.map(l => l.name);
      setLanes(laneNames);

      // Get all cards
      const allCards = await fileService.getAllCards(folderPath);

      // Process tags with colors from DataManager
      const allTags = new Set();
      allCards.forEach(card => {
        const cardTags = getTagsFromContent(card.content);
        cardTags.forEach(tag => allTags.add(tag));
      });

      const tagsWithColors = Array.from(allTags).map(tag => {
        const tagColors = dataManager?.getTagColors(folderPath) || {};
        const color = tagColors[tag] || `var(--color-alt-${pickTagColorIndexBasedOnHash(tag)})`;
        return { name: tag, backgroundColor: color };
      });
      setTagsOptions(tagsWithColors);

      // Update cards with tag colors
      const cardsWithTags = allCards.map(card => {
        const cardTags = getTagsFromContent(card.content);
        const cardTagsWithColors = cardTags.map(tag => {
          const tagOption = tagsWithColors.find(t => t.name === tag);
          return tagOption || { name: tag, backgroundColor: `var(--color-alt-${pickTagColorIndexBasedOnHash(tag)})` };
        });
        return { ...card, tags: cardTagsWithColors };
      });

      setCards(cardsWithTags);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  // Card operations
  async function createNewCard(lane) {
    if (!fileService || !settings) return;

    const folderPath = settings.tasksFolderPath || "tasks";
    const lanePath = `${folderPath}/${lane}`;
    const cardName = `New Card ${Date.now()}`;

    await fileService.createCard(lanePath, cardName, "");
    await fetchData();
  }

  async function createNewLane() {
    if (!fileService || !settings) return;

    const folderPath = settings.tasksFolderPath || "tasks";
    const laneName = `Lane ${Date.now()}`;

    await fileService.createLane(folderPath, laneName);
    await fetchData();
  }

  // Sorting and filtering
  const sortedCards = createMemo(() => {
    let result = [...cards()];

    if (sort() === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort() === "lastUpdated") {
      result.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    }

    return result;
  });

  const filteredCards = createMemo(() =>
    sortedCards().filter(
      (card) =>
        card.name.toLowerCase().includes(search().toLowerCase()) ||
        (card.content || "").toLowerCase().includes(search().toLowerCase())
    )
  );

  function getCardsFromLane(lane) {
    return filteredCards().filter((card) => card.lane === lane);
  }

  // View mode effect
  createEffect(() => {
    document.body.classList.remove("view-mode-regular", "view-mode-extended", "view-mode-compact", "view-mode-tight");
    document.body.classList.add(`view-mode-${viewMode()}`);
  });

  // Initialize
  onMount(() => {
    fetchData();
  });

  // Keyboard navigation
  function handleKeyDown(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      return;
    }

    if (e.key === "n" && e.key === "n") {
      e.preventDefault();
      if (lanes().length > 0) {
        createNewCard(lanes()[0]);
      }
    }
  }

  return (
    <div
      class="tasks-dot-md-board"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      style={{ "height": "100%", "display": "flex", "flex-direction": "column" }}
    >
      <Header
        search={search()}
        onSearchChange={setSearch}
        onNewLaneBtnClick={createNewLane}
        viewMode={viewMode()}
        onViewModeChange={(e) => setViewMode(e.target.value)}
      />

      <DragContainer class="lanes">
        <For each={lanes()}>
          {(lane) => (
            <div class="lane" id={`lane-${lane}`}>
              <header class="lane__header">
                <LaneName
                  name={lane}
                  count={getCardsFromLane(lane).length}
                  onRenameBtnClick={() => console.log("Rename lane:", lane)}
                  onCreateNewCardBtnClick={() => createNewCard(lane)}
                  onDelete={() => console.log("Delete lane:", lane)}
                />
              </header>
              <div class="lane__content" id={`lane-content-${lane}`}>
                <For each={getCardsFromLane(lane)}>
                  {(card) => (
                    <Card
                      name={card.name}
                      tags={card.tags}
                      content={card.content}
                      onClick={() => setSelectedCard(card)}
                    />
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </DragContainer>

      <Show when={selectedCard()}>
        <div class="expanded-card-overlay" onClick={() => setSelectedCard(null)}>
          <div
            class="expanded-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{selectedCard().name}</h2>
            <textarea
              value={selectedCard().content}
              onInput={(e) => console.log("Content changed:", e.target.value)}
              style={{ width: "100%", height: "300px" }}
            />
            <button onClick={() => setSelectedCard(null)}>Close</button>
          </div>
        </div>
      </Show>
    </div>
  );
}
