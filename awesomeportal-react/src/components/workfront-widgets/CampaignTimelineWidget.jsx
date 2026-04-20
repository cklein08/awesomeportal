import React from 'react';

const CampaignTimelineWidget = () => {
  const campaigns = [
    {
      id: 1,
      name: 'Q1 Digital Marketing Campaign',
      tag: 'Digital',
      person: 'Sarah Chen',
      status: 'on-track',
      budget: 125000,
      spent: 89500,
      progress: 85,
      startDate: 'Dec 2023',
      endDate: 'Jan 2024',
      milestone: 'Dec 31'
    },
    {
      id: 2,
      name: 'Brand Redesign Campaign',
      tag: 'Brand',
      person: 'Mike Johnson',
      status: 'on-track',
      budget: 200000,
      spent: 147000,
      progress: 65,
      startDate: 'Jan 2024',
      endDate: 'Mar 2024',
      milestone: 'Jan 14'
    },
    {
      id: 3,
      name: 'Social Media Blitz',
      tag: 'Social',
      person: 'Emily Davis',
      status: 'at-risk',
      budget: 75000,
      spent: 45000,
      progress: 40,
      startDate: 'Jan 2024',
      endDate: 'Feb 2024',
      milestone: 'Jan 31'
    },
    {
      id: 4,
      name: 'Summer Events Series',
      tag: 'Events',
      person: 'Alex Rodriguez',
      status: 'delayed',
      budget: 180000,
      spent: 67000,
      progress: 25,
      startDate: 'Feb 2024',
      endDate: 'May 2024',
      milestone: 'Feb 14'
    },
    {
      id: 5,
      name: 'Product Launch Campaign',
      tag: 'Digital',
      person: 'Lisa Wang',
      status: 'on-track',
      budget: 300000,
      spent: 52000,
      progress: 15,
      startDate: 'Feb 2024',
      endDate: 'Jun 2024',
      milestone: 'Feb 29'
    }
  ];

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
          <h3 className="widget-title">Campaign Timeline & Budgets</h3>
          <p className="widget-subtitle">5 Active Campaigns</p>
        </div>
      </div>

      <div className="timeline-container">
        <div className="timeline-axis">
          <span>Dec 2023</span>
          <span>Jan 2024</span>
          <span>Mar 2024</span>
          <span>Apr 2024</span>
          <span>May 2024</span>
        </div>

        {campaigns.map((campaign) => (
          <div key={campaign.id} className="campaign-item">
            <div className="campaign-info">
              <div className="campaign-name">{campaign.name}</div>
              <div className="campaign-meta">
                <span className={`campaign-tag ${campaign.tag.toLowerCase()}`}>
                  {campaign.tag}
                </span>
                <span>{campaign.person}</span>
                <span className={`campaign-status ${campaign.status}`}>
                  {campaign.status === 'on-track' ? 'On Track' : 
                   campaign.status === 'at-risk' ? 'At Risk' : 'Delayed'}
                </span>
                <span>{formatCurrency(campaign.spent)}/{formatCurrency(campaign.budget)}</span>
              </div>
            </div>
            <div className="timeline-bar" style={{ width: `${campaign.progress}%` }}>
              <div className={`timeline-bar ${campaign.status}`}></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
            <span>On Track</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>
            <span>At Risk</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div>
            <span>Delayed</span>
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Timeline: 12/31/2023 - 6/29/2024
        </div>
      </div>
    </div>
  );
};

export default CampaignTimelineWidget; 