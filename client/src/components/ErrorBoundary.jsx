import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Unhandled Application Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isAr = document.documentElement.lang === 'ar';

      return (
        <div className="error-boundary-screen">
          <div className="error-boundary-card">
            <div className="error-status-badge">System Notice</div>
            <h2 className="error-boundary-title">
              {isAr ? 'حدث خطأ غير متوقع في النظام' : 'An Unexpected Error Occurred'}
            </h2>
            <p className="error-boundary-message">
              {isAr
                ? 'تعذر إكمال العملية الحالية. يمكنك إعادة تحميل الصفحة أو العودة إلى لوحة التحكم الرئيسية.'
                : 'The application encountered an unexpected runtime state. You can reload the page or return to the main platform.'}
            </p>

            <div className="error-boundary-actions">
              <button
                type="button"
                className="btn-primary-action"
                onClick={this.handleReload}
              >
                {isAr ? 'إعادة تحميل الصفحة' : 'Reload Application'}
              </button>
              <button
                type="button"
                className="btn-secondary-action"
                onClick={this.handleGoHome}
              >
                {isAr ? 'العودة للرئيسية' : 'Return to Home'}
              </button>
            </div>

            {this.state.error && (
              <details className="error-debug-details">
                <summary>{isAr ? 'تفاصيل الخطأ التقني' : 'Technical Error Details'}</summary>
                <pre>{this.state.error.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
