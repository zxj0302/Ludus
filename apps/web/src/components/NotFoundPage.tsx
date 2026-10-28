import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 text-center">
      <div className="mb-4">
        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-logic-indigo-100 text-logic-indigo-700">
          404
        </span>
      </div>
      <h1 className="text-3xl font-bold text-warm-stone-800 mb-2">
        {t('app.notFound.title')}
      </h1>
      <p className="text-sm text-warm-stone-500 max-w-md mb-6">
        {t('app.notFound.description')}
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-btn bg-logic-indigo-600 hover:bg-logic-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
      >
        {t('app.notFound.backToHub')}
      </Link>
    </div>
  );
}
