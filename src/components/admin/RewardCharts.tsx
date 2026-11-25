import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { rewardColor } from '../../lib/wheel';
import type { DistributionItem } from '../../types';

export function RewardCharts({ data }: { data: DistributionItem[] }) {
  const chartData = data.map((d) => ({ name: `${d.reward_ml} ML`, reward: d.reward_ml, count: d.count }));
  const total = chartData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-display text-base font-bold">Spins per reward</h2>
        <p className="mb-3 text-xs text-slate-500">Number of customers who won each reward</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="count" name="Winners" radius={[6, 6, 0, 0]}>
                {chartData.map((d) => (
                  <Cell key={d.reward} fill={rewardColor(d.reward)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-display text-base font-bold">Reward share</h2>
        <p className="mb-3 text-xs text-slate-500">Percentage of all spins</p>
        <div className="h-64">
          {total === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">No spins yet</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.filter((d) => d.count > 0)}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {chartData
                    .filter((d) => d.count > 0)
                    .map((d) => (
                      <Cell key={d.reward} fill={rewardColor(d.reward)} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
