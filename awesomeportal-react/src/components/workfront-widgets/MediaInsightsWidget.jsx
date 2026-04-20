import React from 'react';

const MediaInsightsWidget = () => {
  const kpis = [
    {
      id: 1,
      label: 'Total Impressions',
      value: '12.9M',
      change: '+12%',
      positive: true
    },
    {
      id: 2,
      label: 'Total Clicks',
      value: '226K',
      change: '+18%',
      positive: true
    },
    {
      id: 3,
      label: 'Conversion Rate',
      value: '2.8%',
      change: '+5%',
      positive: true
    },
    {
      id: 4,
      label: 'Cost Per Click',
      value: '$1.45',
      change: '-8%',
      positive: false
    },
    {
      id: 5,
      label: 'Return on Ad Spend',
      value: '4.2x',
      change: '+15%',
      positive: true
    },
    {
      id: 6,
      label: 'Brand Awareness',
      value: '78%',
      change: '+3%',
      positive: true
    }
  ];

  const channels = [
    { name: 'Social Media', percentage: 35, color: '#3b82f6' },
    { name: 'Search', percentage: 20, color: '#10b981' },
    { name: 'Email', percentage: 25, color: '#f59e0b' },
    { name: 'Display', percentage: 15, color: '#fbbf24' },
    { name: 'Other', percentage: 5, color: '#94a3b8' }
  ];

  return (
    <div className="widget-card">
      <div className="widget-header">
        <div>
          <h3 className="widget-title">Media Insights Dashboard</h3>
          <p className="widget-subtitle">Last 4 Months</p>
        </div>
      </div>

      <div className="kpi-grid">
        {kpis.map((kpi) => (
          <div key={kpi.id} className="kpi-card">
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-label">{kpi.label}</div>
            <div className={`kpi-change ${kpi.positive ? 'positive' : 'negative'}`}>
              {kpi.positive ? '↗' : '↘'} {kpi.change}
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '2rem',
        marginTop: '1.5rem'
      }}>
        {/* Impressions & Clicks Trend */}
        <div>
          <h4 style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: '#1e293b',
            marginBottom: '1rem'
          }}>
            Impressions & Clicks Trend
          </h4>
          <div style={{
            width: '100%',
            height: '120px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '0.75rem'
          }}>
            📈 Chart Placeholder
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.5rem',
            fontSize: '0.75rem',
            color: '#64748b'
          }}>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
            <span>Jan</span>
          </div>
        </div>

        {/* Channel Performance */}
        <div>
          <h4 style={{ 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            color: '#1e293b',
            marginBottom: '1rem'
          }}>
            Channel Performance
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {channels.map((channel, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: '0.75rem'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: channel.color
                }}></div>
                <span style={{ flex: 1 }}>{channel.name}</span>
                <span style={{ fontWeight: '600' }}>{channel.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaInsightsWidget; 