import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { WagmiProvider } from "wagmi";
import { wagmiAdapter } from "./config.js";

ReactDOM.createRoot(document.getElementById("root")).render(
  <WagmiProvider config={wagmiAdapter.wagmiConfig}>
    <App />
  </WagmiProvider>
);