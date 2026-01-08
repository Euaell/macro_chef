"use client";

import { useEffect, useState } from "react";
import { useMcpTokens, useMcpAnalytics } from "@/lib/hooks/useMcpTokens";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Copy,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  BarChart3,
} from "lucide-react";
import type { CreateMcpTokenResult } from "@/types/mcp";

export default function McpPage() {
  const { tokens, loading, error, fetchTokens, createToken, revokeToken } = useMcpTokens();
  const { analytics, loading: analyticsLoading, fetchAnalytics } = useMcpAnalytics();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [createdToken, setCreatedToken] = useState<CreateMcpTokenResult | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);

  useEffect(() => {
    fetchTokens();
    fetchAnalytics();
  }, [fetchTokens, fetchAnalytics]);

  const handleCreateToken = async () => {
    if (!tokenName.trim()) return;

    const result = await createToken({ name: tokenName.trim() });
    if (result) {
      setCreatedToken(result);
      setTokenName("");
      setCreateDialogOpen(false);
    }
  };

  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm("Are you sure you want to revoke this token? This action cannot be undone.")) {
      return;
    }
    await revokeToken(tokenId);
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const mcpUrl = process.env.NEXT_PUBLIC_MCP_URL || "http://localhost:5001/mcp";
  const configSnippet = (token: string) => `{
  "mcpServers": {
    "mizan": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "${mcpUrl}"
      ],
      "env": {
        "AUTHORIZATION": "Bearer ${token}"
      }
    }
  }
}`;

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">MCP Integration</h1>
        <p className="text-muted-foreground mt-2">
          Manage your Model Context Protocol tokens and monitor usage
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Token Created Success Dialog */}
      {createdToken && (
        <Dialog open={!!createdToken} onOpenChange={() => setCreatedToken(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Token Created Successfully</DialogTitle>
              <DialogDescription>
                Save this token now - it won&apos;t be shown again!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-md flex items-center justify-between">
                <code className="text-sm break-all">{createdToken.plaintextToken}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToken(createdToken.plaintextToken)}
                >
                  {tokenCopied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Claude for Desktop Configuration</h4>
                <div className="text-sm text-muted-foreground mb-2">
                  Add this to your <code>claude_desktop_config.json</code>:
                </div>
                <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto">
                  {configSnippet(createdToken.plaintextToken)}
                </pre>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>📍 Config file location:</p>
                <ul className="list-disc list-inside ml-4">
                  <li>macOS: <code>~/Library/Application Support/Claude/claude_desktop_config.json</code></li>
                  <li>Windows: <code>%APPDATA%\Claude\claude_desktop_config.json</code></li>
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setCreatedToken(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Tabs defaultValue="tokens" className="w-full">
        <TabsList>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>MCP Tokens</CardTitle>
                <CardDescription>
                  Manage your Model Context Protocol authentication tokens
                </CardDescription>
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Token
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate New MCP Token</DialogTitle>
                    <DialogDescription>
                      Create a new token for Claude for Desktop or other MCP clients
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Token Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Home Laptop, Work Desktop"
                        value={tokenName}
                        onChange={(e) => setTokenName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateToken} disabled={!tokenName.trim()}>
                      Generate
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : tokens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tokens yet. Generate your first token to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map((token) => (
                      <TableRow key={token.id}>
                        <TableCell className="font-medium">{token.name}</TableCell>
                        <TableCell>
                          <Badge variant={token.isActive ? "default" : "secondary"}>
                            {token.isActive ? "Active" : "Revoked"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(token.createdAt)}</TableCell>
                        <TableCell>
                          {token.lastUsedAt ? formatDate(token.lastUsedAt) : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          {token.isActive && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRevokeToken(token.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analyticsLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : analytics ? (
            <>
              {/* Overview Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.overview.totalCalls}</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.overview.successRate.toFixed(1)}% success rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.overview.averageExecutionTimeMs}ms
                    </div>
                    <p className="text-xs text-muted-foreground">Per API call</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Tokens</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {analytics.overview.uniqueTokensUsed}
                    </div>
                    <p className="text-xs text-muted-foreground">Tokens in use</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tool Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Tool Usage</CardTitle>
                  <CardDescription>Most frequently used MCP tools</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tool Name</TableHead>
                        <TableHead className="text-right">Calls</TableHead>
                        <TableHead className="text-right">Success</TableHead>
                        <TableHead className="text-right">Failed</TableHead>
                        <TableHead className="text-right">Avg Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.toolUsage.map((tool) => (
                        <TableRow key={tool.toolName}>
                          <TableCell className="font-medium">{tool.toolName}</TableCell>
                          <TableCell className="text-right">{tool.callCount}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {tool.successCount}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {tool.failureCount}
                          </TableCell>
                          <TableCell className="text-right">
                            {tool.averageExecutionTimeMs}ms
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Token Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Token Usage</CardTitle>
                  <CardDescription>Activity by token</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token Name</TableHead>
                        <TableHead className="text-right">Calls</TableHead>
                        <TableHead className="text-right">Last Used</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analytics.tokenUsage.map((token) => (
                        <TableRow key={token.tokenId}>
                          <TableCell className="font-medium">{token.tokenName}</TableCell>
                          <TableCell className="text-right">{token.callCount}</TableCell>
                          <TableCell className="text-right">
                            {formatDate(token.lastUsed)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No analytics data available yet. Start using your MCP tokens to see insights.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
