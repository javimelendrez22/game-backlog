import { Route, Routes } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { FocusLayout } from './layouts/FocusLayout';
import { AddGamePage } from './pages/AddGamePage';
import { GameDetailsPage } from './pages/GameDetailsPage';
import { LibraryPage } from './pages/LibraryPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { StatsPage } from './pages/StatsPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<LibraryPage />} />
      </Route>
      <Route element={<FocusLayout />}>
        <Route path="games/new" element={<AddGamePage />} />
        <Route path="games/:id" element={<GameDetailsPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
