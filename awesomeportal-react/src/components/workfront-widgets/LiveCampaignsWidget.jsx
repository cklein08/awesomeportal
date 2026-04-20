import React from 'react';

const LiveCampaignsWidget = () => {
  const campaigns = [
    {
      id: 1,
      name: 'Winter Holiday Promotion',
      budget: 50000,
      spent: 32000,
      impressions: 2500000,
      clicks: 45000,
      ctr: 1.8
    },
    {
      id: 2,
      name: 'New Year Brand Awareness',
      budget: 75000,
      spent: 41000,
      impressions: 3200000,
      clicks: 52000,
      ctr: 1.6
    },
    {
      id: 3,
      name: 'Q1 Product Launch',
      budget: 120000,
      spent: 28000,
      impressions: 1800000,
      clicks: 31000,
      ctr: 1.7
    },
    {
      id: 4,
      name: 'Email Newsletter Campaign',
      budget: 25000,
      spent: 15000,
      impressions: 850000,
      clicks: 18000,
      ctr: 2.1
    },
    {
      id: 5,
      name: 'Social Media Engagement',
      budget: 30000,
      spent: 22000,
      impressions: 1200000,
      clicks: 24000,
      ctr: 2.0
    }
  ];

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="widget-card">
      <div className="widget-header">
        <div>
          <h3 className="widget-title">Recent Live Campaigns</h3>
          <p className="widget-subtitle">5 Active</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="campaign-card">
            <div className="campaign-card-header">
              <h4 className="campaign-card-title">
                📊 {campaign.name}
              </h4>
              <span className="live-badge">LIVE</span>
            </div>
            
            <div className="campaign-metrics">
              <div className="metric-item">
                <div className="metric-value">{formatCurrency(campaign.budget)}</div>
                <div className="metric-label">Budget</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">{formatCurrency(campaign.spent)}</div>
                <div className="metric-label">Spent</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">{formatNumber(campaign.impressions)}</div>
                <div className="metric-label">Impressions</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">{formatNumber(campaign.clicks)}</div>
                <div className="metric-label">Clicks</div>
              </div>
              <div className="metric-item">
                <div className="metric-value">{campaign.ctr}%</div>
                <div className="metric-label">CTR</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveCampaignsWidget; 