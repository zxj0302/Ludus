import { Component, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props { children: ReactNode }
interface State { error: Error | null }

function ErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <p className="text-lg font-bold text-warm-stone-700">{t('app.error.title')}</p>
        <p className="text-sm text-warm-stone-500">{error.message}</p>
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 rounded-btn bg-logic-indigo-600 text-white text-sm hover:bg-logic-indigo-700 transition-colors"
        >
          {t('app.error.reload')}
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => {
            this.setState({ error: null });
            window.location.reload();
          }}
        />
      );
    }
    return this.props.children;
  }
}
