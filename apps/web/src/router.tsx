import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { App } from './App';
import { HubPage } from './components/HubPage';
import { GamePage } from './components/GamePage';
import { resolveRouterBasename } from './routerBase';

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

const basename = resolveRouterBasename(import.meta.env.BASE_URL);

export const router = createBrowserRouter(routes, { basename });
