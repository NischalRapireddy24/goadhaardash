'use client';

import { useFirebase } from '~/hooks/useFirebase';
import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Agent, FarmerLocation } from '~/types';
import MapComponent from '~/components/Map';
import AnalyticsCharts from '~/components/AnalyticsCharts';
import LocationFilter from '~/components/LocationFilter';

interface AgentStats {
  farmerCount: number;
  cattleCount: number;
}

export default function Dashboard() {
  const { 
    getAgents, 
    getCustomStats, 
    getFarmerLocations, 
    loading,
    selectedDistrict,
    setSelectedDistrict,
    selectedMandal,
    setSelectedMandal 
  } = useFirebase();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<{ [key: string]: AgentStats }>({});
  const [totalStats, setTotalStats] = useState({ farmers: 0, cattle: 0 });
  const [showMap, setShowMap] = useState(false);
  const [farmerLocations, setFarmerLocations] = useState<{
    id: string;
    name: string;
    location: string;
    agentName: string;
  }[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [mandals, setMandals] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      const [agentList, customStats, locations] = await Promise.all([
        getAgents(),
        getCustomStats(),
        getFarmerLocations()
      ]);
      
      setAgents(agentList);
      setStats(customStats);
      setFarmerLocations(locations);
      console.log('Fetched locations:', locations);

      const uniqueDistricts = [...new Set(locations.map(loc => loc.district))].filter(Boolean);
      setDistricts(uniqueDistricts);

      const uniqueMandals = [...new Set(locations.map(loc => loc.mandal))].filter(Boolean);
      setMandals(uniqueMandals);
    }

    fetchData();
  }, [getAgents, getCustomStats, getFarmerLocations]);

  useEffect(() => {
    const totals = Object.values(stats).reduce((acc, curr) => ({
      farmers: acc.farmers + (curr.farmerCount || 0),
      cattle: acc.cattle + (curr.cattleCount || 0)
    }), { farmers: 0, cattle: 0 });
    
    setTotalStats(totals);
  }, [stats]);

  const filteredData = useMemo(() => {
    let filtered = [...agents];
    
    if (selectedDistrict !== 'all') {
      filtered = filtered.filter(agent => {
        const agentStats = stats[agent.id];
        return agentStats?.districtStats?.[selectedDistrict];
      });
    }

    if (selectedMandal !== 'all') {
      filtered = filtered.filter(agent => {
        const agentStats = stats[agent.id];
        return Object.values(agentStats?.districtStats || {}).some(
          district => district.mandals[selectedMandal]
        );
      });
    }

    return filtered;
  }, [agents, stats, selectedDistrict, selectedMandal]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            GoAdhaar Admin Analytics 
          </h1>
          <LocationFilter
            districts={districts}
            selectedDistrict={selectedDistrict}
            mandals={mandals}
            selectedMandal={selectedMandal}
            onDistrictChange={setSelectedDistrict}
            onMandalChange={setSelectedMandal}
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800">Total Farmers</h2>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {totalStats.farmers}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800">Total Cattle</h2>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {totalStats.cattle}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800">Active Agents</h2>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {agents.length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800">Avg. Cattle/Farmer</h2>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {totalStats.farmers ? (totalStats.cattle / totalStats.farmers).toFixed(1) : '0'}
            </p>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Analytics Overview</h2>
          <AnalyticsCharts agents={agents} stats={stats} />
        </div>

        {/* Map Toggle Button */}
        <div className="flex justify-end space-x-4 mb-6">
          <button
            onClick={() => setShowMap(!showMap)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
        </div>

        {/* Map Component */}
        {showMap && (
          <div className="mb-8 bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Farmer Locations ({farmerLocations.length})
            </h2>
            <div className="h-[400px] relative">
              <MapComponent farmers={farmerLocations} />
            </div>
          </div>
        )}

        {/* Agent Cards */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Agent Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((agent) => (
            <div 
              key={agent.id} 
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center mb-4">
                {agent.imageUrl ? (
                  <Image
                    src={agent.imageUrl}
                    alt={agent.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xl font-semibold">
                      {agent.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="ml-4">
                  <h2 className="text-xl font-semibold text-gray-800">{agent.name}</h2>
                  <p className="text-sm text-gray-500">{agent.email}</p>
                  <p className="text-sm text-gray-500">{agent.phoneNumber}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Farmers</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats[agent.id]?.farmerCount || 0}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Cattle</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats[agent.id]?.cattleCount || 0}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {agents.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">No Agents Found</h3>
            <p className="mt-2 text-sm text-gray-500">
              There are no registered agents in the system yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 