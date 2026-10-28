import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { matchRoutes, createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import './i18n';
import { routes } from './router';
import { NotFoundPage } from './components/NotFoundPage';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';

describe('router configuration and catch-all handling', () => {
  let originalError: typeof console.error;

  beforeEach(() => {
    originalError = console.error;
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('useLayoutEffect does nothing on the server')) {
        return;
      }
      originalError(...args);
    };
  });

  afterEach(() => {
    console.error = originalError;
  });

  it('defines errorElement and catch-all route on root route', () => {
    const rootRoute = routes.find(r => r.path === '/');
    expect(rootRoute).toBeDefined();
    expect(rootRoute?.errorElement).toBeDefined();

    const catchAllRoute = rootRoute?.children?.find(r => r.path === '*');
    expect(catchAllRoute).toBeDefined();
  });

  it('matches invalid paths to the catch-all NotFoundPage route', () => {
    const invalidPaths = ['/non-existent', '/invalid/nested/path', '/games/unknown/extra'];

    for (const path of invalidPaths) {
      const matches = matchRoutes(routes, path);
      expect(matches).not.toBeNull();
      const matchedChild = matches?.[matches.length - 1];
      expect(matchedChild?.route.path).toBe('*');
    }
  });

  it('renders NotFoundPage content when navigating to an invalid route', () => {
    const memoryRouter = createMemoryRouter(routes, {
      initialEntries: ['/completely-unknown-route'],
    });

    const html = renderToStaticMarkup(<RouterProvider router={memoryRouter} />);
    expect(html).toContain('404');
    expect(html).toContain('页面未找到');
    expect(html).toContain('返回游戏合集');
  });

  it('NotFoundPage renders back-to-hub link and 404 badge', () => {
    const memoryRouter = createMemoryRouter(
      [
        {
          path: '*',
          element: <NotFoundPage />,
        },
      ],
      { initialEntries: ['/missing'] },
    );

    const html = renderToStaticMarkup(<RouterProvider router={memoryRouter} />);
    expect(html).toContain('404');
    expect(html).toContain('href="/"');
    expect(html).toContain('页面未找到');
  });

  it('RouteErrorBoundary renders gracefully with error details and recovery actions', () => {
    const memoryRouter = createMemoryRouter(
      [
        {
          path: '*',
          element: <RouteErrorBoundary />,
        },
      ],
      { initialEntries: ['/error'] },
    );

    const html = renderToStaticMarkup(<RouterProvider router={memoryRouter} />);
    expect(html).toContain('出了点问题');
    expect(html).toContain('加载该页面时发生意外错误。');
    expect(html).toContain('重新加载');
    expect(html).toContain('href="/"');
  });
});
