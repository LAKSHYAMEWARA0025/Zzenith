'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface TrendChartProps {
  data: any[];
  platform: 'youtube' | 'instagram';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
        <p className="text-gray-400 text-xs mb-1">Upload #{label}</p>
        <p className="text-white font-bold text-sm">
          {payload[0].value.toLocaleString()} {payload[0].payload.metric}
        </p>
      </div>
    );
  }
  return null;
};

export default function TrendChart({ data, platform }: TrendChartProps) {
  // Transform raw data into chart-friendly format
  // We reverse the array so the chart goes from Left (Oldest) -> Right (Newest)
  const chartData = data.slice(0, 5).reverse().map((item: any, index: number) => ({
    name: index + 1, // X-Axis Label
    value: platform === 'youtube' ? Number(item.viewCount) : Number(item.likes),
    metric: platform === 'youtube' ? 'Views' : 'Likes',
  }));

  const color = platform === 'youtube' ? '#ef4444' : '#ec4899'; // Red for YT, Pink for IG

  return (
    <div className="w-full h-[250px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`color${platform}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#666" 
            tick={{ fill: '#666', fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#666" 
            tick={{ fill: '#666', fontSize: 12 }} 
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => 
              value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : 
              value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value
            }
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)' }} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={3}
            fillOpacity={1} 
            fill={`url(#color${platform})`} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}