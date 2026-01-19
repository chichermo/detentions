'use client';

import { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parse, subMonths, subYears } from 'date-fns';
import nl from 'date-fns/locale/nl';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Detention } from '@/types';

interface PeriodComparisonProps {
  detentions: Detention[];
}

export default function PeriodComparison({ detentions }: PeriodComparisonProps) {
  const [period1Type, setPeriod1Type] = useState<'month' | 'year'>('month');
  const [period1Value, setPeriod1Value] = useState(format(new Date(), 'yyyy-MM'));
  const [period2Type, setPeriod2Type] = useState<'month' | 'year'>('month');
  const [period2Value, setPeriod2Value] = useState(format(subMonths(new Date(), 1), 'yyyy-MM'));

  const getPeriodDetentions = (type: 'month' | 'year', value: string) => {
    let startDate: Date;
    let endDate: Date;

    if (type === 'month') {
      startDate = startOfMonth(parse(value + '-01', 'yyyy-MM-dd', new Date()));
      endDate = endOfMonth(startDate);
    } else {
      const year = parseInt(value);
      startDate = startOfYear(new Date(year, 0, 1));
      endDate = endOfYear(startDate);
    }

    return detentions.filter(d => {
      const detDate = parseISO(d.date);
      return isWithinInterval(detDate, { start: startDate, end: endDate });
    });
  };

  const period1Detentions = getPeriodDetentions(period1Type, period1Value);
  const period2Detentions = getPeriodDetentions(period2Type, period2Value);

  const calculateStats = (detentions: Detention[]) => {
    return {
      total: detentions.length,
      uniqueStudents: new Set(detentions.map(d => d.student.split(' - ')[0])).size,
      withChromebook: detentions.filter(d => d.canUseChromebook).length,
      toPrint: detentions.filter(d => d.shouldPrint).length,
      byDay: {
        MAANDAG: detentions.filter(d => d.dayOfWeek === 'MAANDAG').length,
        DINSDAG: detentions.filter(d => d.dayOfWeek === 'DINSDAG').length,
        DONDERDAG: detentions.filter(d => d.dayOfWeek === 'DONDERDAG').length,
      },
    };
  };

  const stats1 = calculateStats(period1Detentions);
  const stats2 = calculateStats(period2Detentions);

  const getComparison = (val1: number, val2: number) => {
    if (val1 === 0 && val2 === 0) return { change: 0, icon: Minus, color: 'text-slate-400' };
    if (val2 === 0) return { change: 100, icon: TrendingUp, color: 'text-emerald-400' };
    const change = ((val1 - val2) / val2) * 100;
    if (change > 0) return { change, icon: TrendingUp, color: 'text-emerald-400' };
    if (change < 0) return { change: Math.abs(change), icon: TrendingDown, color: 'text-red-400' };
    return { change: 0, icon: Minus, color: 'text-slate-400' };
  };

  const comparisonData = [
    {
      metric: 'Totaal Nablijven',
      period1: stats1.total,
      period2: stats2.total,
      ...getComparison(stats1.total, stats2.total),
    },
    {
      metric: 'Unieke Leerlingen',
      period1: stats1.uniqueStudents,
      period2: stats2.uniqueStudents,
      ...getComparison(stats1.uniqueStudents, stats2.uniqueStudents),
    },
    {
      metric: 'Met Chromebook',
      period1: stats1.withChromebook,
      period2: stats2.withChromebook,
      ...getComparison(stats1.withChromebook, stats2.withChromebook),
    },
    {
      metric: 'Te Printen',
      period1: stats1.toPrint,
      period2: stats2.toPrint,
      ...getComparison(stats1.toPrint, stats2.toPrint),
    },
  ];

  const dayComparisonData = [
    {
      day: 'MAANDAG',
      period1: stats1.byDay.MAANDAG,
      period2: stats2.byDay.MAANDAG,
    },
    {
      day: 'DINSDAG',
      period1: stats1.byDay.DINSDAG,
      period2: stats2.byDay.DINSDAG,
    },
    {
      day: 'DONDERDAG',
      period1: stats1.byDay.DONDERDAG,
      period2: stats2.byDay.DONDERDAG,
    },
  ];

  const formatPeriodLabel = (type: 'month' | 'year', value: string) => {
    if (type === 'month') {
      return format(parse(value + '-01', 'yyyy-MM-dd', new Date()), 'MMMM yyyy', { locale: nl });
    }
    return value;
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Calendar className="h-5 w-5 text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-100">Periode Vergelijking</h3>
      </div>

      {/* Period Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Periode 1</label>
          <div className="flex gap-2">
            <select
              value={period1Type}
              onChange={(e) => setPeriod1Type(e.target.value as 'month' | 'year')}
              className="input-field flex-1"
            >
              <option value="month">Maand</option>
              <option value="year">Jaar</option>
            </select>
            {period1Type === 'month' ? (
              <input
                type="month"
                value={period1Value}
                onChange={(e) => setPeriod1Value(e.target.value)}
                className="input-field flex-1"
              />
            ) : (
              <input
                type="number"
                value={period1Value}
                onChange={(e) => setPeriod1Value(e.target.value)}
                min="2020"
                max="2030"
                className="input-field flex-1"
                placeholder="Jaar"
              />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {formatPeriodLabel(period1Type, period1Value)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Periode 2</label>
          <div className="flex gap-2">
            <select
              value={period2Type}
              onChange={(e) => setPeriod2Type(e.target.value as 'month' | 'year')}
              className="input-field flex-1"
            >
              <option value="month">Maand</option>
              <option value="year">Jaar</option>
            </select>
            {period2Type === 'month' ? (
              <input
                type="month"
                value={period2Value}
                onChange={(e) => setPeriod2Value(e.target.value)}
                className="input-field flex-1"
              />
            ) : (
              <input
                type="number"
                value={period2Value}
                onChange={(e) => setPeriod2Value(e.target.value)}
                min="2020"
                max="2030"
                className="input-field flex-1"
                placeholder="Jaar"
              />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {formatPeriodLabel(period2Type, period2Value)}
          </p>
        </div>
      </div>

      {/* Comparison Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {comparisonData.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">{item.metric}</span>
                <div className={`flex items-center gap-1 ${item.color}`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-bold">
                    {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <div>
                  <p className="text-2xl font-bold text-slate-100">{item.period1}</p>
                  <p className="text-xs text-slate-400">Periode 1</p>
                </div>
                <span className="text-slate-500">vs</span>
                <div>
                  <p className="text-2xl font-bold text-slate-300">{item.period2}</p>
                  <p className="text-xs text-slate-400">Periode 2</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Comparison Chart */}
      <div>
        <h4 className="text-md font-semibold text-slate-200 mb-4">Vergelijking per Dag</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dayComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
            <Legend />
            <Bar dataKey="period1" fill="#8b5cf6" name={formatPeriodLabel(period1Type, period1Value)} radius={[8, 8, 0, 0]} />
            <Bar dataKey="period2" fill="#10b981" name={formatPeriodLabel(period2Type, period2Value)} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
