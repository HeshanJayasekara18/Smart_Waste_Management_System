import React, { useState, useEffect, useCallback } from 'react';
import MunicipalAuthorityService from '../../services/WasteSubmissionService';
import RequestsTable from './RequestsTable';
import StatisticsCards from './StatisticsCards';
import FilterBar from './FilterBar';

export default function MunicipalDashboard() {
  const [requests, setRequests] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [filters, setFilters] = useState({ status: 'all' });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allRequests, stats] = await Promise.all([
        MunicipalAuthorityService.list(),
        MunicipalAuthorityService.getStatistics()
      ]);

      const filtered = Array.isArray(allRequests)
        ? (filters.status === 'all' ? allRequests : allRequests.filter(r => r.status === filters.status))
        : [];

      setRequests(filtered);
      setStatistics(stats || {});
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Municipal Authority Dashboard</h1>
      
      <StatisticsCards statistics={statistics} />
      
      <FilterBar filters={filters} setFilters={setFilters} />
      
      <RequestsTable 
        requests={requests} 
        loading={loading}
        onRefresh={loadData}
      />
    </div>
  );
}