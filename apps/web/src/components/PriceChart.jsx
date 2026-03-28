
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBaseAuth, useNetwork } from '@/contexts/BaseAuthContext.jsx';

// Mock data generator for demonstration
const generateMockData = (days, basePrice, volatility) => {
  const data = [];
  let currentPrice = basePrice;
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Random walk
    const change = (Math.random() - 0.5) * volatility;
    currentPrice = currentPrice * (1 + change);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: currentPrice,
    });
  }
  return data;
};

const PriceChart = () => {
  const { activeAddress } = useBaseAuth();
  const { selectedNetwork } = useNetwork();
  const [timeframe, setTimeframe] = useState('7D');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Re-fetch or regenerate data when network or address changes
  useEffect(() => {
    setLoading(true);
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      let basePrice = 2500; // Default ETH-ish
      if (selectedNetwork.id === 137) basePrice = 0.8; // Polygon
      if (selectedNetwork.id === 250) basePrice = 0.4; // Fantom
      
      const days = timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 90;
      setChartData(generateMockData(days, basePrice, 0.05));
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [timeframe, selectedNetwork.id, activeAddress]);

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
  const startPrice = chartData.length > 0 ? chartData[0].price : 0;
  const priceChange = currentPrice - startPrice;
  const percentChange = startPrice > 0 ? (priceChange / startPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: val < 1 ? 4 : 2,
      maximumFractionDigits: val < 1 ? 4 : 2
    }).format(val);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="glass-card-strong border-border/50 shadow-xl">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 gap-4">
          <div>
            <CardTitle className="text-xl text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {selectedNetwork.name} Native Token
            </CardTitle>
            {activeAddress && (
              <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                Viewing context for: {activeAddress.slice(0,6)}...{activeAddress.slice(-4)}
              </p>
            )}
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-lg border border-border/30">
            {['7D', '30D', '90D'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  timeframe === tf 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          {loading ? (
            <div className="h-[350px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-6 flex items-end gap-4">
                <h3 className="text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  {formatCurrency(currentPrice)}
                </h3>
                <div className={`flex items-center gap-1 mb-1 font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>{Math.abs(percentChange).toFixed(2)}%</span>
                </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${val >= 1000 ? (val/1000).toFixed(1)+'k' : val.toFixed(2)}`}
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        borderColor: 'hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                      formatter={(value) => [formatCurrency(value), 'Price']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="price" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PriceChart;
