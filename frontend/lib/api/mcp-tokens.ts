import type {
  CreateMcpTokenCommand,
  CreateMcpTokenResult,
  GetMcpTokensResult,
  McpTokenDto,
  McpUsageAnalyticsResult,
} from "@/types/mcp";

const API_BASE = "/api/bff";

export class McpTokenApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
  }
}

async function fetchApi<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new McpTokenApiError(
      response.status,
      error.error || response.statusText,
      error
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const mcpTokenApi = {
  /**
   * Create a new MCP token
   */
  async createToken(
    command: CreateMcpTokenCommand
  ): Promise<CreateMcpTokenResult> {
    return fetchApi<CreateMcpTokenResult>("/McpTokens", {
      method: "POST",
      body: JSON.stringify(command),
    });
  },

  /**
   * Get all MCP tokens for the current user
   */
  async getMyTokens(): Promise<McpTokenDto[]> {
    const result = await fetchApi<GetMcpTokensResult>("/McpTokens", {
      method: "GET",
    });
    return result.tokens;
  },

  /**
   * Revoke an MCP token
   */
  async revokeToken(tokenId: string): Promise<void> {
    await fetchApi<void>(`/McpTokens/${tokenId}`, {
      method: "DELETE",
    });
  },

  /**
   * Get MCP usage analytics
   */
  async getAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<McpUsageAnalyticsResult> {
    const params = new URLSearchParams();
    if (startDate) {
      params.append("startDate", startDate.toISOString());
    }
    if (endDate) {
      params.append("endDate", endDate.toISOString());
    }

    const queryString = params.toString();
    const path = queryString ? `/McpTokens/analytics?${queryString}` : "/McpTokens/analytics";

    return fetchApi<McpUsageAnalyticsResult>(path, {
      method: "GET",
    });
  },
};
