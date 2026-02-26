import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AppKitProvider } from "@reown/appkit/react";

// Load environment variable for Project ID
const PROJECT_ID = "c00145b1e7f8d39d821971d8aeb61276";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppKitProvider projectId={PROJECT_ID}>
      <App />
    </AppKitProvider>
  </React.StrictMode>
);