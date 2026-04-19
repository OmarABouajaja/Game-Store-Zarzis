import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = async () => {
    // Aggressive cache clearing for stuck clients
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      } catch (e) {
        console.error('SW unregister failed:', e);
      }
    }
    // Hard reload attempt (deprecated in some browsers but good intent)
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-red-500/10 p-4">
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Oops! Something went wrong / Oups ! / عذراً!
              </h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. / Nous avons rencontré une erreur inattendue. / واجهنا خطأ غير متوقع.
              </p>
            </div>



            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleRetry} variant="outline">
                <RefreshCw className="w-4 h-4 me-2" />
                Try Again / Réessayer / حاول مجددا
              </Button>
              <Button onClick={this.handleReload}>
                Reload Page / Recharger la page / إعادة تحميل
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              If this error persists, please contact Game Store Zarzis support / Si le problème persiste, contactez le support / إذا استمرت المشكلة، يرجى الاتصال بالدعم
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
