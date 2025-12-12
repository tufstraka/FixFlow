"use client"

import * as React from "react"
import {
  Settings,
  Key,
  Globe,
  Bell,
  Shield,
  Save,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = React.useState("http://localhost:3000")
  const [apiKey, setApiKey] = React.useState("")

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure your FixFlow dashboard
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* API Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              <CardTitle>API Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure the connection to your FixFlow bot server
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bot Server URL</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://your-bot-server.com"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                The URL of your FixFlow bot server
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button variant="outline">
                  <Key className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Used to authenticate requests to the bot server
              </p>
            </div>

            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save API Settings
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure how you receive updates about bounties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Email Notifications</div>
                <div className="text-xs text-muted-foreground">
                  Receive email updates for bounty activity
                </div>
              </div>
              <input type="checkbox" className="h-4 w-4" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Bounty Created</div>
                <div className="text-xs text-muted-foreground">
                  When a new bounty is created from a failing test
                </div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Bounty Claimed</div>
                <div className="text-xs text-muted-foreground">
                  When someone claims a bounty
                </div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Bounty Completed</div>
                <div className="text-xs text-muted-foreground">
                  When a bounty is completed and payment is sent
                </div>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Bounty Escalated</div>
                <div className="text-xs text-muted-foreground">
                  When a bounty amount increases due to escalation
                </div>
              </div>
              <input type="checkbox" className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Security and access settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">Webhook Signature Verification</div>
                <div className="text-xs text-muted-foreground">
                  Verify GitHub webhook signatures for security
                </div>
              </div>
              <input type="checkbox" defaultChecked disabled className="h-4 w-4" />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-medium">API Rate Limiting</div>
                <div className="text-xs text-muted-foreground">
                  Limit API requests to prevent abuse
                </div>
              </div>
              <input type="checkbox" defaultChecked disabled className="h-4 w-4" />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm font-medium">GitHub App Installation</div>
              <div className="text-xs text-muted-foreground mb-2">
                Install the FixFlow GitHub App on your repositories
              </div>
              <Button variant="outline">
                Configure GitHub App
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Default Bounty Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <CardTitle>Default Bounty Configuration</CardTitle>
            </div>
            <CardDescription>
              Default settings for new bounties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Default Amount (MNEE)</label>
                <input
                  type="number"
                  defaultValue={75}
                  min={1}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Max Escalation</label>
                <input
                  type="number"
                  defaultValue={3}
                  min={1}
                  max={10}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm font-medium">Severity Multipliers</div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Critical</label>
                  <input
                    type="number"
                    defaultValue={4.0}
                    step={0.1}
                    min={1}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">High</label>
                  <input
                    type="number"
                    defaultValue={2.0}
                    step={0.1}
                    min={1}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Medium</label>
                  <input
                    type="number"
                    defaultValue={1.0}
                    step={0.1}
                    min={0.1}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Low</label>
                  <input
                    type="number"
                    defaultValue={0.5}
                    step={0.1}
                    min={0.1}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <Button>
              <Save className="h-4 w-4 mr-2" />
              Save Default Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}