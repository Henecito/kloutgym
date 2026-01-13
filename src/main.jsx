import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./app/App";
import { AuthProvider } from "./context/AuthContext";
import { ReservationsProvider } from "./context/ReservationsContext";
import "./styles/theme.css";
import "bootstrap/dist/css/bootstrap.min.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <ReservationsProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ReservationsProvider>
  </AuthProvider>
);
