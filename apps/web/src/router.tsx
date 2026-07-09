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
    ],
  },
];

/** Strip Vite trailing slash — React Router basename must not end with `/`. */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined;

export const router = createBrowserRouter(routes, { basename });
