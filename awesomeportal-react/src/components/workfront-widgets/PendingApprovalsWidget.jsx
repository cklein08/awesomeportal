import React, { useState, useEffect } from 'react';
import { Flex, ProgressCircle, Provider, defaultTheme } from '@adobe/react-spectrum';

/**
 * Standalone Pending Approvals widget (no Workfront UIX/API).
 * Shows mock empty state or optional sample data for dashboard display.
 */
const PendingApprovalsWidget = () => {
  const [approvals, setApprovals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // No Workfront attach/API - just show empty state after brief loading
    const t = setTimeout(() => {
      setApprovals([]);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="widget-card">
      <div className="widget-header">
        <div>
          <h3 className="widget-title">Pending Approvals</h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '0.25rem'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>
              {approvals.length}
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Provider theme={defaultTheme}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Flex justifyContent="center" alignItems="center" height="size-600">
              <ProgressCircle aria-label="Loading approvals..." isIndeterminate />
            </Flex>
          </div>
        </Provider>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
          <h4>No Approvals Assigned</h4>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
            When running in Workfront, pending items will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default PendingApprovalsWidget;
