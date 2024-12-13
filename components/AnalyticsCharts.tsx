import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface AnalyticsChartsProps {
  agents: any[];
  stats: { [key: string]: { farmerCount: number; cattleCount: number } };
}

export default function AnalyticsCharts({ agents, stats }: AnalyticsChartsProps) {
  // Prepare data for charts
  const agentPerformanceData = agents.map(agent => ({
    name: agent.name.split(' ')[0], // Use first name only for better display
    farmers: stats[agent.id]?.farmerCount || 0,
    cattle: stats[agent.id]?.cattleCount || 0,
  }));

  // Calculate total distribution for pie chart
  const totalDistribution = agents.map(agent => ({
    name: agent.name.split(' ')[0],
    value: (stats[agent.id]?.cattleCount || 0) + (stats[agent.id]?.farmerCount || 0)
  }));

  // Calculate efficiency ratio (cattle per farmer)
  const efficiencyData = agents.map(agent => ({
    name: agent.name.split(' ')[0],
    ratio: stats[agent.id]?.farmerCount 
      ? (stats[agent.id]?.cattleCount / stats[agent.id]?.farmerCount).toFixed(2)
      : 0
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Bar Chart - Agent Performance */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Agent Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={agentPerformanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend 
              wrapperStyle={{
                color: '#94a3b8'
              }}
            />
            <Bar dataKey="farmers" fill="#3b82f6" name="Farmers" />
            <Bar dataKey="cattle" fill="#22c55e" name="Cattle" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart - Total Distribution */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Workload Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={totalDistribution}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={{
                fill: '#94a3b8'
              }}
            >
              {totalDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend 
              wrapperStyle={{
                color: '#94a3b8'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Line Chart - Efficiency Ratio */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm lg:col-span-2">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
          Efficiency Ratio (Cattle per Farmer)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={efficiencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend 
              wrapperStyle={{
                color: '#94a3b8'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="ratio" 
              stroke="#8b5cf6" 
              name="Cattle/Farmer Ratio"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 