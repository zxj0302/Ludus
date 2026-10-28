import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function RouteErrorBoundary() {
  const { t } = useTranslation();
  const error = useRouteError();

  const is404 = isRouteErrorResponse(error) && error.status === 404;

  let errorMessage: string | null = null;
  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || (typeof error.data === 'string' ? error.data : null);
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  return (
    <div className="min-h-screen flex flex-col bg-warm-stone-50 text-warm-stone-800">
      <header className="glass-panel border-b border-white/60">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline group">
            <span className="w-8 h-8 rounded-xl bg-logic-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              L
            </span>
            <span className="text-lg font-bold text-warm-stone-800 group-hover:text-logic-indigo-700 transition-colors">
              {t('app.title')}
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-warm-stone-200 text-warm-stone-700 text-xl font-bold mb-2">
            {is404 ? '404' : '!'}
          </div>
          <h1 className="text-2xl font-bold text-warm-stone-800">
            {is404 ? t('app.notFound.title') : t('app.error.title')}
          </h1>
          <p className="text-sm text-warm-stone-500">
            {is404
              ? t('app.notFound.description')
              : errorMessage || t('app.error.description')}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {!is404 && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-btn bg-logic-indigo-600 text-white text-sm font-medium hover:bg-logic-indigo-700 transition-colors shadow-sm"
              >
                {t('app.error.reload')}
              </button>
            )}
            <Link
              to="/"
              className="px-4 py-2 rounded-btn bg-warm-stone-200 text-warm-stone-800 text-sm font-medium hover:bg-warm-stone-300 transition-colors"
            >
              {t('app.notFound.backToHub')}
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-warm-stone-400">
        {t('app.footer', { year: new Date().getFullYear() })}
      </footer>
    </div>
  );
}
