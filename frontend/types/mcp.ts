// Temporary type definitions for MCP tokens
// These will be replaced by code generation from OpenAPI spec

export interface McpTokenDto {
  id: string;
  name: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
}

export interface CreateMcpTokenCommand {
  name: string;
  expiresAt?: string | null;
}

export interface CreateMcpTokenResult {
  id: string;
  plaintextToken: string;
  name: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface GetMcpTokensResult {
  tokens: McpTokenDto[];
}

export interface ValidateTokenCommand {
  token: string;
}

export interface ValidateTokenResult {
  userId: string;
  isValid: boolean;
}
