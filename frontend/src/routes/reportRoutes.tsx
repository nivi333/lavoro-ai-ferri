import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ReportsListPage from '../pages/reports/ReportsListPage';
import OperationalReportsPage from '../pages/reports/operational/OperationalReportsPage';
import ProductionEfficiencyReportPage from '../pages/reports/operational/ProductionEfficiencyReportPage';

const ReportRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<ReportsListPage />} />
      <Route path="/operational" element={<OperationalReportsPage />} />
      <Route path="/operational/production-efficiency" element={<ProductionEfficiencyReportPage />} />
      {/* Add more report routes as they are implemented */}
    </Routes>
  );
};

export default ReportRoutes;
