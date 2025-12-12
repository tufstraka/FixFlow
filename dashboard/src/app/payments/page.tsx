"use client"

import * as React from "react"
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency, formatDateTime, truncateAddress } from "@/lib/utils"

// Mock data
const payments = [
  {
    id: "1",
    bountyId: "142",
    bountyTitle: "Fix authentication timeout issue",
    amount: 75,
    recipientWallet: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    transactionId: "tx_abc123456789",
    status: "COMPLETED",
    repository: "acme/auth-service",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "2",
    bountyId: "139",
    bountyTitle: "Database migration failure on PostgreSQL 15",
    amount: 100,
    recipientWallet: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    transactionId: "tx_def987654321",
    status: "COMPLETED",
    repository: "acme/api-gateway",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "3",
    bountyId: "145",
    bountyTitle: "Memory leak in websocket handler",
    amount: 125,
    recipientWallet: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
    transactionId: null,
    status: "PROCESSING",
    repository: "acme/realtime-service",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "4",
    bountyId: "130",
    bountyTitle: "Incorrect timezone handling",
    amount: 50,
    recipientWallet: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
    transactionId: "tx_ghi456789012",
    status: "COMPLETED",
    repository: "acme/reporting",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "5",
    bountyId: "128",
    bountyTitle: "API rate limiting not working",
    amount: 80,
    recipientWallet: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    transactionId: null,
    status: "FAILED",
    repository: "acme/api-gateway",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
]

const stats = {
  totalPayments: payments.length,
  totalAmount: payments.filter((p) => p.status === "COMPLETED").reduce((sum, p) => sum + p.amount, 0),
  pendingAmount: payments.filter((p) => p.status === "PROCESSING").reduce((sum, p) => sum + p.amount, 0),
  failedCount: payments.filter((p) => p.status === "FAILED").length,
}

function getStatusIcon(status: string) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className="h-4 w-4 text-success" />
    case "PROCESSING":
      return <Clock className="h-4 w-4 text-warning animate-pulse-slow" />
    case "FAILED":
      return <XCircle className="h-4 w-4 text-destructive" />
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "COMPLETED":
      return "success"
    case "PROCESSING":
      return "warning"
    case "FAILED":
      return "destructive"
    default:
      return "secondary"
  }
}

export default function PaymentsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            Track all bounty payments and transactions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalAmount)} MNEE
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.pendingAmount)} MNEE
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All bounty payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(payment.status)}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{payment.bountyTitle}</span>
                      <Badge variant={getStatusVariant(payment.status) as "success" | "warning" | "destructive" | "secondary"}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{payment.repository}</span>
                      <span>•</span>
                      <span>Bounty #{payment.bountyId}</span>
                      <span>•</span>
                      <span>{formatDateTime(payment.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Recipient</div>
                    <code className="text-xs">
                      {truncateAddress(payment.recipientWallet, 6)}
                    </code>
                  </div>

                  {payment.transactionId && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Transaction</div>
                      <code className="text-xs flex items-center gap-1">
                        {truncateAddress(payment.transactionId, 6)}
                        <ExternalLink className="h-3 w-3" />
                      </code>
                    </div>
                  )}

                  <div className="text-right min-w-[100px]">
                    <div className="text-lg font-bold">
                      {formatCurrency(payment.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">MNEE</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}