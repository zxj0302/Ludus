import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { App } from './App';
import { HubPage } from './components/HubPage';
import { GamePage } from './components/GamePage';
import { DemoPage } from './demo/DemoPage';
import { NotFoundPage } from './components/NotFoundPage';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import { resolveRouterBasename } from './routerBase';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <HubPage /> },
      { path: 'demo', element: <DemoPage /> },
      { path: 'game/:gameId', element: <GamePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

const basename = resolveRouterBasename(import.meta.env.BASE_URL);

export const createAppRouter = (base = basename) => createBrowserRouter(routes, { basename: base });

export const router = typeof document !== 'undefined'
  ? createAppRouter()
  : ({} as ReturnType<typeof createBrowserRouter>);
