import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCompactCurrency, formatWeekRange, getWeekDays, WEEKDAY_LABELS, isThisWeek, shiftWeek } from '@/lib/format';
import type { WeeklyData } from '@/types';

interface WeeklyChartProps {
  currentWeekStart: Date;
  onWeekChange: (weekStart: Date) => void;
  data: WeeklyData[];
}

export function WeeklyChart({ currentWeekStart, onWeekChange, data }: WeeklyChartProps) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);
  const chartHeight = 160;
  const canGoForward = !isThisWeek(currentWeekStart);

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onWeekChange(shiftWeek(currentWeekStart, -1))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-white capitalize">
            {formatWeekRange(currentWeekStart)}
          </span>
          <button
            onClick={() => canGoForward && onWeekChange(shiftWeek(currentWeekStart, 1))}
            disabled={!canGoForward}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-400">Ing.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-400">Gasto</span>
          </div>
        </div>
      </div>

      <div className="flex items-end justify-between gap-1.5" style={{ height: chartHeight }}>
        {data.map((d, i) => {
          const hasData = d.income > 0 || d.expense > 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="flex items-end justify-center gap-1 w-full h-full">
                <div
                  className="flex-1 max-w-[14px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 hover:opacity-80"
                  style={{
                    height: hasData ? `${(d.income / maxVal) * (chartHeight - 24)}px` : '2px',
                    minHeight: d.income > 0 ? '4px' : '2px',
                  }}
                  title={`Ingresos ${WEEKDAY_LABELS[i]}: ${formatCompactCurrency(d.income)}`}
                />
                <div
                  className="flex-1 max-w-[14px] bg-gradient-to-t from-rose-600 to-rose-400 rounded-t-md transition-all duration-500 hover:opacity-80"
                  style={{
                    height: hasData ? `${(d.expense / maxVal) * (chartHeight - 24)}px` : '2px',
                    minHeight: d.expense > 0 ? '4px' : '2px',
                  }}
                  title={`Gastos ${WEEKDAY_LABELS[i]}: ${formatCompactCurrency(d.expense)}`}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface DonutChartProps {
  segments: { label: string; value: number; color: string }[];
  total: number;
  centerLabel: string;
}

export function DonutChart({ segments, total, centerLabel }: DonutChartProps) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-44 h-44 rounded-full border-8 border-slate-800 flex items-center justify-center">
          <span className="text-slate-600 text-sm">Sin datos</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#1e293b" strokeWidth="14" />
          {segments.map((seg, i) => {
            const dash = (seg.value / total) * circumference;
            const arc = (
              <circle
                key={i}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="14"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            );
            offset += dash;
            return arc;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{formatCompactCurrency(total)}</span>
          <span className="text-xs text-slate-500">{centerLabel}</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-slate-400">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
