import React from 'react';
import { ToastQueue } from '@react-spectrum/toast';

interface ErrorBoundaryProps {
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: unknown, info: unknown) {
        // Log to console; in production could send to telemetry
        // eslint-disable-next-line no-console
        console.error('ErrorBoundary caught an error:', error, info);
        try {
            const msg = (error instanceof Error && error.message) ? error.message : String(error);
            ToastQueue.negative(`Extension error: ${msg}`, { timeout: 6000 });
        } catch (e) {
            // ignore toast errors
        }
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? null;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
