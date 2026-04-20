import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import WorkfrontDashboardView from './WorkfrontDashboardView';

/**
 * Dashboard page: renders the Workfront Extensibility Portal (WEP) widget-based
 * dashboard (Campaign Timeline, Pending Approvals, Live Campaigns, Media Insights,
 * Top Assets, AI-Powered Actions). Replaces the previous Asset Dashboard.
 */
const Dashboard: React.FC = () => {
  return (
    <ErrorBoundary>
      <WorkfrontDashboardView />
    </ErrorBoundary>
  );
};

export default Dashboard;
