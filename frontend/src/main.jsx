import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "./App";
import { useWebSocket } from "./hooks/useWebSocket";
import { useUiStore } from "./store/uiStore";
import "./styles/globals.css";

const qc = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function Root() {
  useWebSocket();
  return <App />;
}

useUiStore.getState().applyThemeClass();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <Root />
    </QueryClientProvider>
  </React.StrictMode>
);
