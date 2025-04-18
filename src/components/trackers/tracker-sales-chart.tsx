'use client';

import { Sale } from "@/db/queries/sales";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrackerSalesChartProps {
    salesData: Sale[];
}

export default function TrackerSalesChart({ salesData }: TrackerSalesChartProps) {
    if (!salesData || salesData.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">No sales data available.</div>;
    }

    // Format data for the chart
    const chartData = salesData.map(sale => ({
        // Format date for display on the X-axis (e.g., 'YYYY-MM-DD')
        date: sale.date.toLocaleDateString('en-CA'), // 'en-CA' gives YYYY-MM-DD format
        percentage: sale.result,
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart
                data={chartData}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="percentage" stroke="#8884d8" activeDot={{ r: 8 }} name="Sales %" />
            </LineChart>
        </ResponsiveContainer>
    );
}
