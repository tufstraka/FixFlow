"use client"

import * as React from "react"
import Link from "next/link"
import {
  GitFork,
  Wallet,
  Bug,
  ExternalLink,
  Settings,
  Plus,
  RefreshCw,
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
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, truncateAddress } from "@/lib/utils"

// Mock data
const repositories = [
  {
    id: "1",
    owner: "acme",
    name: "auth-service",
    fullName: "acme/auth-service",
    installationId: 12345678,
    walletAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    walletBalance: 500,
    defaultBountyAmount: 75,
    isActive: true,
    totalBounties: 24,
    activeBounties: 3,
    completedBounties: 18,
    totalPaidOut: 1850,
  },
  {
    id: "2",
    owner: "acme",
    name: "api-gateway",
    fullName: "acme/api-gateway",
    installationId: 12345679,
    walletAddress: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
    walletBalance: 350,
    defaultBountyAmount: 100,
    isActive: true,
    totalBounties: 15,
    activeBounties: 2,
    completedBounties: 11,
    totalPaidOut: 1200,
  },
  {
    id: "3",
    owner: "acme",
    name: "payments",
    fullName: "acme/payments",
    installationId: 12345680,
    walletAddress: "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
    walletBalance: 1000,
    defaultBountyAmount: 150,
    isActive: true,
    totalBounties: 32,
    activeBounties: 5,
    completedBounties: 25,
    totalPaidOut: 4200,
  },
  {
    id: "4",
    owner: "acme",
    name: "realtime-service",
    fullName: "acme/realtime-service",
    installationId: 12345681,
    walletAddress: null,
    walletBalance: 0,
    defaultBountyAmount: 75,
    isActive: false,
    totalBounties: 8,
    activeBounties: 0,
    completedBounties: 6,
    totalPaidOut: 425,
  },
]

export default function RepositoriesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Repositories</h1>
          <p className="text-muted-foreground">
            Manage repositories and their bounty configurations
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Repository
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repositories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {repositories.filter((r) => r.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                repositories.reduce((sum, r) => sum + r.walletBalance, 0)
              )}{" "}
              MNEE
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                repositories.reduce((sum, r) => sum + r.totalPaidOut, 0)
              )}{" "}
              MNEE
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repository List */}
      <div className="space-y-4">
        {repositories.map((repo) => (
          <Card
            key={repo.id}
            className={!repo.isActive ? "opacity-60" : "hover:border-primary/50 transition-colors"}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <GitFork className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`https://github.com/${repo.fullName}`}
                          className="font-semibold text-lg hover:underline flex items-center gap-1"
                          target="_blank"
                        >
                          {repo.fullName}
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                        <Badge variant={repo.isActive ? "success" : "secondary"}>
                          {repo.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Default bounty: {formatCurrency(repo.defaultBountyAmount)} MNEE
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Bounties</div>
                      <div className="text-xl font-semibold">{repo.totalBounties}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Active</div>
                      <div className="text-xl font-semibold text-primary">
                        {repo.activeBounties}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                      <div className="text-xl font-semibold text-success">
                        {repo.completedBounties}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Paid Out</div>
                      <div className="text-xl font-semibold">
                        {formatCurrency(repo.totalPaidOut)}
                      </div>
                    </div>
                  </div>

                  {repo.totalBounties > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Completion Rate</span>
                        <span className="font-medium">
                          {Math.round(
                            (repo.completedBounties / repo.totalBounties) * 100
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={(repo.completedBounties / repo.totalBounties) * 100}
                        className="h-2"
                      />
                    </div>
                  )}
                </div>

                <div className="text-right space-y-4">
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                      <Wallet className="h-4 w-4" />
                      Wallet Balance
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(repo.walletBalance)} MNEE
                    </div>
                  </div>

                  {repo.walletAddress ? (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Wallet Address
                      </div>
                      <code className="text-xs rounded bg-muted px-2 py-1">
                        {truncateAddress(repo.walletAddress, 6)}
                      </code>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Wallet
                    </Button>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}