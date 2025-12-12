"use client"

import * as React from "react"
import Link from "next/link"
import {
  Bug,
  Search,
  Filter,
  ChevronDown,
  ExternalLink,
  Clock,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatRelativeTime, truncateAddress } from "@/lib/utils"

// Mock data
const bounties = [
  {
    id: "1",
    title: "Fix authentication timeout issue",
    description: "Users are experiencing timeout errors when trying to authenticate with OAuth providers",
    repository: { owner: "acme", name: "auth-service", fullName: "acme/auth-service" },
    issueNumber: 142,
    amount: 200,
    originalAmount: 100,
    severity: "CRITICAL",
    status: "ACTIVE",
    workflowName: "CI Tests",
    testName: "test_oauth_authentication",
    claimedBy: null,
    claimedAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    escalationLevel: 2,
  },
  {
    id: "2",
    title: "Database connection pool exhaustion",
    description: "Under heavy load, the database connection pool is being exhausted causing service degradation",
    repository: { owner: "acme", name: "api-gateway", fullName: "acme/api-gateway" },
    issueNumber: 89,
    amount: 150,
    originalAmount: 100,
    severity: "HIGH",
    status: "CLAIMED",
    workflowName: "Integration Tests",
    testName: "test_high_load_scenario",
    claimedBy: "@db_expert",
    claimedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    claimantWallet: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    escalationLevel: 1,
  },
  {
    id: "3",
    title: "Race condition in payment processing",
    description: "Concurrent payment requests can lead to duplicate charges",
    repository: { owner: "acme", name: "payments", fullName: "acme/payments" },
    issueNumber: 256,
    amount: 175,
    originalAmount: 175,
    severity: "CRITICAL",
    status: "ACTIVE",
    workflowName: "E2E Tests",
    testName: "test_concurrent_payments",
    claimedBy: null,
    claimedAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    escalationLevel: 0,
  },
  {
    id: "4",
    title: "Memory leak in websocket handler",
    description: "Long-running websocket connections cause memory to gradually increase",
    repository: { owner: "acme", name: "realtime-service", fullName: "acme/realtime-service" },
    issueNumber: 45,
    amount: 125,
    originalAmount: 75,
    severity: "MEDIUM",
    status: "COMPLETED",
    workflowName: "Memory Tests",
    testName: "test_websocket_memory",
    claimedBy: "@memory_ninja",
    claimedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    claimantWallet: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    escalationLevel: 2,
  },
  {
    id: "5",
    title: "Incorrect date formatting in reports",
    description: "Reports show dates in wrong timezone for non-UTC users",
    repository: { owner: "acme", name: "reporting", fullName: "acme/reporting" },
    issueNumber: 78,
    amount: 50,
    originalAmount: 50,
    severity: "LOW",
    status: "PENDING",
    workflowName: "Unit Tests",
    testName: "test_date_formatting",
    claimedBy: null,
    claimedAt: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    escalationLevel: 0,
  },
]

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "PENDING", label: "Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "CLAIMED", label: "Claimed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "EXPIRED", label: "Expired" },
]

const severityOptions = [
  { value: "all", label: "All Severity" },
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
]

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
    case "PENDING":
      return "warning"
    case "ACTIVE":
      return "default"
    case "CLAIMED":
      return "secondary"
    case "COMPLETED":
      return "success"
    case "EXPIRED":
      return "outline"
    default:
      return "secondary"
  }
}

export default function BountiesPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [severityFilter, setSeverityFilter] = React.useState("all")

  const filteredBounties = bounties.filter((bounty) => {
    const matchesSearch =
      search === "" ||
      bounty.title.toLowerCase().includes(search.toLowerCase()) ||
      bounty.repository.fullName.toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === "all" || bounty.status === statusFilter

    const matchesSeverity =
      severityFilter === "all" || bounty.severity === severityFilter

    return matchesSearch && matchesStatus && matchesSeverity
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bounties</h1>
          <p className="text-muted-foreground">
            Manage and track all bounties across your repositories
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search bounties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {severityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredBounties.length} of {bounties.length} bounties
      </div>

      {/* Bounties List */}
      <div className="space-y-4">
        {filteredBounties.map((bounty) => (
          <Card key={bounty.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <Bug className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{bounty.title}</h3>
                        <Badge variant={getSeverityVariant(bounty.severity) as "destructive" | "warning" | "default" | "secondary"}>
                          {bounty.severity}
                        </Badge>
                        <Badge variant={getStatusVariant(bounty.status) as "warning" | "default" | "secondary" | "success" | "outline"}>
                          {bounty.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {bounty.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Link
                      href={`https://github.com/${bounty.repository.fullName}`}
                      className="flex items-center gap-1 hover:text-foreground"
                      target="_blank"
                    >
                      {bounty.repository.fullName}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <span>•</span>
                    <span>#{bounty.issueNumber}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(bounty.createdAt)}
                    </span>
                    {bounty.claimedBy && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {bounty.claimedBy}
                        </span>
                      </>
                    )}
                  </div>

                  {bounty.testName && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Failed test: </span>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {bounty.testName}
                      </code>
                    </div>
                  )}
                </div>

                <div className="text-right space-y-2">
                  <div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(bounty.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">MNEE</div>
                  </div>
                  {bounty.escalationLevel > 0 && (
                    <div className="text-xs text-warning">
                      Escalated {bounty.escalationLevel}x
                    </div>
                  )}
                  {bounty.originalAmount !== bounty.amount && (
                    <div className="text-xs text-muted-foreground line-through">
                      Original: {formatCurrency(bounty.originalAmount)}
                    </div>
                  )}
                </div>
              </div>

              {bounty.claimantWallet && (
                <>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Claimant wallet:</span>
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      {truncateAddress(bounty.claimantWallet, 8)}
                    </code>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredBounties.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bug className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No bounties found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}