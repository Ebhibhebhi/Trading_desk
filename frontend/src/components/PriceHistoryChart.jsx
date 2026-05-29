import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export default function PriceHistoryChart({ data }) {
  const formatted = data.map(d => ({
    time: new Date(d.polled_at).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    }),
    floor: d.price_floor ? Math.round(d.price_floor) : null,
    median: d.price_median ? Math.round(d.price_median) : null,
    ceiling: d.price_ceiling ? Math.round(d.price_ceiling) : null,
    listings: d.listing_count,
  }));

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer>
        <LineChart data={formatted} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a36" />
          <XAxis dataKey="time" stroke="#555" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis yAxisId="price" stroke="#555" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} width={48} />
          <YAxis yAxisId="listings" orientation="right" stroke="#555" tick={{ fontSize: 10 }} width={36} />
          <Tooltip
            contentStyle={{ background: '#17171f', border: '1px solid #2a2a36', borderRadius: 6, fontSize: 12 }}
            labelStyle={{ color: '#aaa' }}
            formatter={(val, name) => name === 'listings' ? val : `$${val}`}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line yAxisId="price" type="monotone" dataKey="floor" stroke="#22c55e" dot={false} name="Floor" strokeWidth={2} />
          <Line yAxisId="price" type="monotone" dataKey="median" stroke="#f59e0b" dot={false} name="Median" strokeWidth={2} />
          <Line yAxisId="price" type="monotone" dataKey="ceiling" stroke="#ef4444" dot={false} name="Ceiling" strokeWidth={1.5} strokeDasharray="4 2" />
          <Line yAxisId="listings" type="monotone" dataKey="listings" stroke="#818cf8" dot={false} name="Listings" strokeWidth={1.5} strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
