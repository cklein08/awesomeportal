import React from 'react';
import { Navigate } from 'react-router-dom';

/** Legacy `/admin` URL redirects to the unified Admin activities screen. */
const AdminHub: React.FC = () => <Navigate to="/admin/activities" replace />;

export default AdminHub;
