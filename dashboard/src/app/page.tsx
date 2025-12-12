"use client"

import * as React from "react"
import {
  Bug,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"

// Mock data - replace with actual API calls
const stats = {
  totalBounties: 156,
  activeBounties: 23,
  completedBounties: 118,
  totalPaidOut: 15420,
  averageBountyAmount: 98.85,
  averageResolutionTime: 4.2,
  weeklyChange: {
    bounties: 12,
    completed: 8,
    paidOut: 1250,
  },
}

const recentActivity = [
  {
    id: "1",
    type: "bounty_completed",
    description: "Bounty #142 completed by @developer123",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    amount: 75,
  },
  {
    id: "2",
    type: "payment_sent",
    description: "Payment sent for Bounty #142",
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    amount: 75,
  },
  {
    id: "3",
    type: "bounty_claimed",
    description: "Bounty #145 claimed by @dev_ninja",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    amount: 100,
  },
  {
    id: "4",
    type: "bounty_escalated",
    description: "Bounty #138 escalated to 90 MNEE",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    amount: 90,
  },
  {
    id: "5",
    type: "bounty_created",
    description: "New bounty created for failing test in auth-service",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    amount: 50,
  },
]

const topBounties = [
  {
    id: "1",
    title: "Fix authentication timeout issue",
    repository: "acme/auth-service",
    amount: 200,
    severity: "CRITICAL",
    status: "ACTIVE",
    claimedBy: "@developer456",
  },
  {
    id: "2",
    title: "Database connection pool exhaustion",
    repository: "acme/api-gateway",
    amount: 150,
    severity: "HIGH",
    status: "CLAIMED",
    claimedBy: "@db_expert",
  },
  {
    id: "3",
    title: "Race condition in payment processing",
    repository: "acme/payments",
    amount: 175,
    severity: "CRITICAL",
    status: "ACTIVE",
    claimedBy: null,
  },
]

const bountiesByStatus = {
  PENDING: 5,
  ACTIVE: 23,
  CLAIMED: 10,
  COMPLETED: 118,
}

function getActivityIcon(type: string) {
  switch (type) {
    case "bounty_created":
      return <Bug className="h-4 w-4 text-primary" />
    case "bounty_claimed":
      return <Clock className="h-4 w-4 text-blue-500" />
    case "bounty_completed":
      return <CheckCircle className="h-4 w-4 text-success" />
    case "payment_sent":
      return <DollarSign className="h-4 w-4 text-success" />
    case "bounty_escalated":
      return <TrendingUp className="h-4 w-4 text-warning" />
    default:
      return <Activity className="h-4 w-4" />
  }
}

function getSeverityVariant(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "destructive"
    case "HIGH":
      return "warning"
    case "MEDIUM":
      return "default"
    case "LOW":
      return "secondary"
    default:
      return "secondary"
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "ACTIVE":
      return "default"
    case "CLAIMED":
      return "secondary"
    case "COMPLETED":
      return "success"
    default:
      return "secondary"
  }
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your bounty ecosystem
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bounties</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBounties}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-success mr-1" />
              <span className="text-success">+{stats.weeklyChange.bounties}</span>
              <span className="ml-1">this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bounties</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBounties}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>Awaiting fixes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedBounties}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-success mr-1" />
              <span className="text-success">+{stats.weeklyChange.completed}</span>
              <span className="ml-1">this week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalPaidOut)} MNEE
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-success mr-1" />
              <span className="text-success">
                +{formatCurrency(stats.weeklyChange.paidOut)}
              </span>
              <span className="ml-1">this week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Bounty Status Distribution */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Bounty Distribution</CardTitle>
            <CardDescription>Current status of all bounties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active</span>
                <span className="font-medium">{bountiesByStatus.ACTIVE}</span>
              </div>
              <Progress
                value={
                  (bountiesByStatus.ACTIVE / stats.totalBounties) * 100
                }
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Claimed</span>
                <span className="font-medium">{bountiesByStatus.CLAIMED}</span>
              </div>
              <Progress
                value={
                  (bountiesByStatus.CLAIMED / stats.totalBounties) * 100
                }
                className="h-2 [&>div]:bg-blue-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">{bountiesByStatus.COMPLETED}</span>
              </div>
              <Progress
                value={
                  (bountiesByStatus.COMPLETED / stats.totalBounties) * 100
                }
                className="h-2 [&>div]:bg-success"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">{bountiesByStatus.PENDING}</span>
              </div>
              <Progress
                value={
                  (bountiesByStatus.PENDING / stats.totalBounties) * 100
                }
                className="h-2 [&>div]:bg-warning"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across all bounties</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="leading-tight">{activity.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatRelativeTime(activity.timestamp)}</span>
                        {activity.amount && (
                          <>
                            <span>•</span>
                            <span>{activity.amount} MNEE</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Top Bounties */}
      <Card>
        <CardHeader>
          <CardTitle>Top Active Bounties</CardTitle>
          <CardDescription>
            Highest value bounties awaiting resolution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topBounties.map((bounty) => (
              <div
                key={bounty.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{bounty.title}</span>
                    <Badge variant={getSeverityVariant(bounty.severity) as "destructive" | "warning" | "default" | "secondary"}>
                      {bounty.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{bounty.repository}</span>
                    {bounty.claimedBy && (
                      <>
                        <span>•</span>
                        <span>Claimed by {bounty.claimedBy}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={getStatusVariant(bounty.status) as "default" | "secondary" | "success"}>
                    {bounty.status}
                  </Badge>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatCurrency(bounty.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">MNEE</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Average Bounty</CardTitle>
            <CardDescription>Mean bounty value across all completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrency(stats.averageBountyAmount)} MNEE
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Resolution Time</CardTitle>
            <CardDescription>Mean time from creation to completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.averageResolutionTime} days
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}