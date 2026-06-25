import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { App } from './App';
import { HubPage } from './components/HubPage';
import { GamePage } from './components/GamePage';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HubPage /> },
      { path: 'game/:gameId', element: <GamePage /> },
      { path: 'game/:gameId/level/:levelId', element: <GamePage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
