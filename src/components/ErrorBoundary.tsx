'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary 오류:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-900">
            <h3 className="font-bold mb-2">문제가 발생했습니다</h3>
            <p className="text-sm">데이터를 불러오는데 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.</p>
          </div>
        )
      );
    }

    return this.props.children;
  }
} 