// App.js
// Clean, maintainable entry point following SOLID principles.
// SRP: App only controls high-level routing/layout imports.

import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import ScheduleManagerDash from "./schedule_component/schedule_manager/ScheduleManagerDash";
import CollectionRoutesform from "./schedule_component/schedule_manager/CollectionRouteForm";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/schedule-manager-Dash" element={<ScheduleManagerDash />} />
        <Route path="/collectionRoutespage" element={<CollectionRoutesform />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;