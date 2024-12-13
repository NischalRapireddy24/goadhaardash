'use client';

import { useFirebase } from '~/hooks/useFirebase';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Agent } from '~/types';

interface CustomStats {
  farmerCount: number;
  cattleCount: number;
}

export default function AdminPage() {
  const { getAgents, setCustomStats, getCustomStats, loading } = useFirebase();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [customStats, setLocalCustomStats] = useState<{ [key: string]: CustomStats }>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchData() {
      const [agentList, stats] = await Promise.all([
        getAgents(),
        getCustomStats()
      ]);
      setAgents(agentList);
      setLocalCustomStats(stats);
    }

    fetchData();
  }, [getAgents, getCustomStats]);

  const handleStatChange = (agentId: string, field: keyof CustomStats, value: string) => {
    const numValue = parseInt(value) || 0;
    setLocalCustomStats(prev => ({
      ...prev,
      [agentId]: {
        ...prev[agentId],
        [field]: numValue
      }
    }));
  };

  const handleSave = async (agentId: string) => {
    setSaving(agentId);
    try {
      await setCustomStats(agentId, customStats[agentId] || { farmerCount: 0, cattleCount: 0 });
    } catch (error) {
      console.error('Error saving stats:', error);
      alert('Failed to save stats');
    } finally {
      setSaving(null);
    }
  };

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-gray-800">Manage Agent Stats</h1>
          <Link 
            href="/dashboard"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {filteredAgents.map((agent) => (
            <div 
              key={agent.id} 
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xl font-semibold">
                      {agent.name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-semibold text-gray-800">{agent.name}</h2>
                    <p className="text-sm text-gray-500">{agent.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSave(agent.id)}
                  disabled={saving === agent.id}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 
                            transition-colors disabled:bg-blue-300 min-w-[120px]"
                >
                  {saving === agent.id ? 'Saving...' : 'Save'}
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Farmer Count
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      value={customStats[agent.id]?.farmerCount || 0}
                      onChange={(e) => handleStatChange(agent.id, 'farmerCount', e.target.value)}
                      className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cattle Count
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="0"
                      value={customStats[agent.id]?.cattleCount || 0}
                      onChange={(e) => handleStatChange(agent.id, 'cattleCount', e.target.value)}
                      className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 