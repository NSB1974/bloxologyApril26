
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellPlus, Trash2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PriceAlerts = ({ symbol, currentPrice }) => {
  const [alerts, setAlerts] = useState([]);
  const [newAlertPrice, setNewAlertPrice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (symbol) {
      const storedAlerts = localStorage.getItem(`bloxology_alerts_${symbol.toUpperCase()}`);
      if (storedAlerts) {
        try {
          setAlerts(JSON.parse(storedAlerts));
        } catch (e) {
          console.error('Failed to parse alerts', e);
          setAlerts([]);
        }
      } else {
        setAlerts([]);
      }
    }
  }, [symbol]);

  const saveAlerts = (newAlerts) => {
    setAlerts(newAlerts);
    if (symbol) {
      localStorage.setItem(`bloxology_alerts_${symbol.toUpperCase()}`, JSON.stringify(newAlerts));
    }
  };

  const handleAddAlert = (e) => {
    e.preventDefault();
    setError('');
    
    const price = parseFloat(newAlertPrice);
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    if (alerts.some(a => a.targetPrice === price)) {
      setError('An alert for this price already exists');
      return;
    }

    const newAlert = {
      id: Date.now().toString(),
      targetPrice: price,
      createdAt: new Date().toISOString(),
      isHigher: price > currentPrice
    };

    const updatedAlerts = [...alerts, newAlert].sort((a, b) => b.targetPrice - a.targetPrice);
    saveAlerts(updatedAlerts);
    setNewAlertPrice('');
  };

  const handleRemoveAlert = (id) => {
    const updatedAlerts = alerts.filter(a => a.id !== id);
    saveAlerts(updatedAlerts);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: val < 1 ? 4 : 2,
      maximumFractionDigits: val < 1 ? 4 : 2
    }).format(val);
  };

  const calculateDiff = (target) => {
    if (!currentPrice) return 0;
    return ((target - currentPrice) / currentPrice) * 100;
  };

  return (
    <Card className="glass-card border-border/50 h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2 text-[var(--text-primary)]">
          <Bell className="h-5 w-5 text-primary" />
          Price Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-6">
        <form onSubmit={handleAddAlert} className="flex gap-2">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] font-medium">
              $
            </div>
            <Input
              type="number"
              step="any"
              placeholder="Target price..."
              value={newAlertPrice}
              onChange={(e) => setNewAlertPrice(e.target.value)}
              className="pl-7 input-high-contrast"
            />
          </div>
          <Button type="submit" disabled={!newAlertPrice} className="crypto-gradient text-white font-medium">
            <BellPlus className="h-4 w-4" />
          </Button>
        </form>

        {error && (
          <div className="text-sm text-destructive font-medium flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {alerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 text-[var(--text-secondary)] text-sm font-medium"
              >
                No active alerts for {symbol || 'this token'}
              </motion.div>
            ) : (
              alerts.map((alert) => {
                const diff = calculateDiff(alert.targetPrice);
                const isTriggered = alert.isHigher ? currentPrice >= alert.targetPrice : currentPrice <= alert.targetPrice;
                
                return (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-colors duration-300 ${
                      isTriggered 
                        ? 'bg-accent/10 border-accent/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]' 
                        : 'glass-card border-border/30'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`font-medium ${isTriggered ? 'text-accent' : 'text-[var(--text-primary)]'}`}>
                        {formatCurrency(alert.targetPrice)}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] flex items-center gap-1 font-medium">
                        {diff > 0 ? (
                          <TrendingUp className="h-3 w-3 text-accent" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-destructive" />
                        )}
                        {Math.abs(diff).toFixed(2)}% away
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAlert(alert.id)}
                      className="h-8 w-8 text-[var(--text-secondary)] hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceAlerts;
