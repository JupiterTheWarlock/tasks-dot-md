import { createSignal } from "solid-js";

export default function App() {
  const [count, setCount] = createSignal(0);

  console.log("App component rendering");
  console.log("FileService:", window.tasksDotMdFileService);
  console.log("DataManager:", window.tasksDotMdDataManager);
  console.log("Settings:", window.tasksDotMdSettings);

  return (
    <div style={{ padding: "20px", "background-color": "var(--background-secondary)", color: "var(--text-normal)" }}>
      <h1>Tasks.md Plugin</h1>
      <p>Plugin is working! Count: {count()}</p>
      <button onClick={() => setCount(count() + 1)}>Click me</button>

      <div style={{ "margin-top": "20px", padding: "10px", border: "1px solid var(--background-modifier-border)" }}>
        <h3>Debug Info:</h3>
        <p>FileService: {window.tasksDotMdFileService ? "✓ Loaded" : "✗ Not found"}</p>
        <p>DataManager: {window.tasksDotMdDataManager ? "✓ Loaded" : "✗ Not found"}</p>
        <p>Settings: {window.tasksDotMdSettings ? JSON.stringify(window.tasksDotMdSettings) : "✗ Not found"}</p>
      </div>
    </div>
  );
}
