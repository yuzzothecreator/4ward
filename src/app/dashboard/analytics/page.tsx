"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const revenueData = [
  { month: "Jan", revenue: 1200 },
  { month: "Feb", revenue: 1800 },
  { month: "Mar", revenue: 2400 },
  { month: "Apr", revenue: 2100 },
  { month: "May", revenue: 3200 },
  { month: "Jun", revenue: 4100 },
  { month: "Jul", revenue: 4800 },
];

const popularData = [
  { name: "CampusConnect", sales: 186 },
  { name: "StudyBuddy", sales: 301 },
  { name: "FinTrack", sales: 245 },
  { name: "ChainVote", sales: 890 },
  { name: "SecureVault", sales: 94 },
];

const activityData = [
  { day: "Mon", views: 420 },
  { day: "Tue", views: 510 },
  { day: "Wed", views: 380 },
  { day: "Thu", views: 640 },
  { day: "Fri", views: 720 },
  { day: "Sat", views: 290 },
  { day: "Sun", views: 250 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted">Revenue growth, popular projects, and customer activity.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue growth</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "#121826", border: "1px solid #ffffff20", borderRadius: 12 }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Popular projects</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #ffffff20", borderRadius: 12 }}
                />
                <Bar dataKey="sales" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer activity (views)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #ffffff20", borderRadius: 12 }}
                />
                <Area type="monotone" dataKey="views" stroke="#3b82f6" fill="#3b82f630" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
