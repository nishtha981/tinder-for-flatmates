import React from "react";
import ReactDOM from "react-dom/client";
import { RealtimeProvider } from "@neon/realtime-react";
import App from "./App";
import { realtimeClient } from "./realtime";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RealtimeProvider client={realtimeClient}>
      <App />
    </RealtimeProvider>
  </React.StrictMode>
);
