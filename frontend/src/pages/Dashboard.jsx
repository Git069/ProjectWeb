import React from 'react';
import { useAuth } from '../context/AuthContext';
import CustomerDashboard from './CustomerDashboard';
import CraftsmanDashboard from './CraftsmanDashboard';

function Dashboard() {
  const { isCustomer, isCraftsman } = useAuth();

  if (isCustomer()) {
    return <CustomerDashboard />;
  }

  if (isCraftsman()) {
    return <CraftsmanDashboard />;
  }

  return null;
}

export default Dashboard;
