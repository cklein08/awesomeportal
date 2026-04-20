import React from 'react';
import {
  CampaignTimelineWidget,
  PendingApprovalsWidget,
  LiveCampaignsWidget,
  MediaInsightsWidget,
  TopAssetsWidget,
  AIPoweredActionsWidget,
} from '../components/workfront-widgets';
import './WorkfrontDashboard.css';

const WorkfrontDashboardView = () => {
  return (
    <div className="wep-app">
      <main className="wep-main-content">
        <div className="wep-content-wrapper">
          <div className="wep-top-section">
            <div className="wep-campaign-timeline-section">
              <CampaignTimelineWidget />
            </div>
            <div className="wep-pending-approvals-section">
              <PendingApprovalsWidget />
            </div>
          </div>

          <div className="wep-middle-section">
            <div className="wep-live-campaigns-section">
              <LiveCampaignsWidget />
            </div>
            <div className="wep-media-insights-section">
              <MediaInsightsWidget />
            </div>
          </div>

          <div className="wep-bottom-section">
            <div className="wep-top-assets-section">
              <TopAssetsWidget />
            </div>
            <div className="wep-ai-actions-section">
              <AIPoweredActionsWidget />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkfrontDashboardView;
