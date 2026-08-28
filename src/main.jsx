import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import Lock from "./Lock";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Lock>
      <App />
    </Lock>
  </React.StrictMode>
);
