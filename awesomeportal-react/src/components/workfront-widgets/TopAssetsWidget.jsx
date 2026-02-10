import React from 'react';

const TopAssetsWidget = () => {
  const assets = [
    {
      id: 1,
      name: 'Summer Campaign Video',
      impressions: 2100000,
      engagement: 8.2,
      brandLift: 24.5
    },
    {
      id: 2,
      name: 'Product Launch Banner',
      impressions: 1800000,
      engagement: 6.9,
      brandLift: 19.8
    },
    {
      id: 3,
      name: 'Holiday Collection Ad',
      impressions: 3200000,
      engagement: 5.4,
      brandLift: 17.3
    },
    {
      id: 4,
      name: 'Brand Story Carousel',
      impressions: 1500000,
      engagement: 7.1,
      brandLift: 15.6
    },
    {
      id: 5,
      name: 'Testimonial Video',
      impressions: 1200000,
      engagement: 9.3,
      brandLift: 12.9
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

  return (
    <div className="widget-card">
      <div className="widget-header">
        <div>
          <h3 className="widget-title">Top 5 Performing Assets (Brand Lift)</h3>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {assets.map((asset) => (
          <div key={asset.id} className="asset-item">
            <div className="asset-info">
              <div className="asset-name">{asset.name}</div>
              <div className="asset-metrics">
                <span>{formatNumber(asset.impressions)} impressions</span>
                <span>{asset.engagement}% engagement</span>
              </div>
            </div>
            <div className="asset-lift">+{asset.brandLift}% Brand Lift</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopAssetsWidget; 