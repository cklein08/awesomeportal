/**
 * Adobe AI Agents API Client
 * Handles communication with Adobe AI Agents API for agent management and interactions
 */

export interface AIAgent {
    id: string;
    name: string;
    description?: string;
    type: 'assistant' | 'workflow' | 'automation' | 'custom';
    status: 'active' | 'inactive' | 'training' | 'error';
    capabilities?: string[];
    createdDate?: string;
    modifiedDate?: string;
    version?: string;
}

export interface AIAgentMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
}

export interface AIAgentConversation {
    id: string;
    agentId: string;
    messages: AIAgentMessage[];
    createdDate?: string;
    updatedDate?: string;
}

export interface AIAgentRequest {
    agentId: string;
    message: string;
    context?: Record<string, unknown>;
    stream?: boolean;
}

export interface AIAgentResponse {
    message: string;
    agentId: string;
    conversationId?: string;
    metadata?: {
        tokensUsed?: number;
        responseTime?: number;
        confidence?: number;
    };
}

export interface AIAgentListRequest {
    type?: 'assistant' | 'workflow' | 'automation' | 'custom' | 'all';
    status?: 'active' | 'inactive' | 'training' | 'error' | 'all';
    limit?: number;
    offset?: number;
    searchQuery?: string;
}

export interface AIAgentListResponse {
    agents: AIAgent[];
    total: number;
    limit: number;
    offset: number;
}

export interface AIAgentError {
    error: {
        code: string;
        message: string;
    };
}

export class AIAgentsClient {
    private baseUrl: string;
    private accessToken: string | null;

    constructor(accessToken?: string) {
        // Adobe AI Agents API endpoint
        // Note: Update this URL based on your actual AI Agents API endpoint
        this.baseUrl = 'https://ai-agents.adobe.io/v1';
        this.accessToken = accessToken || null;
    }

    /**
     * Set the access token for API authentication
     */
    setAccessToken(token: string): void {
        this.accessToken = token;
    }

    /**
     * Get list of AI Agents
     */
    async listAgents(request: AIAgentListRequest = {}): Promise<AIAgentListResponse> {
        if (!this.accessToken) {
            throw new Error('Access token is required. Please authenticate first.');
        }

        try {
            const params = new URLSearchParams();
            if (request.type && request.type !== 'all') {
                params.append('type', request.type);
            }
            if (request.status && request.status !== 'all') {
                params.append('status', request.status);
            }
            if (request.limit) {
                params.append('limit', request.limit.toString());
            }
            if (request.offset) {
                params.append('offset', request.offset.toString());
            }
            if (request.searchQuery) {
                params.append('q', request.searchQuery);
            }

            const url = `${this.baseUrl}/agents?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'X-API-Key': import.meta.env.VITE_ADOBE_CLIENT_ID || '',
                },
            });

            if (!response.ok) {
                const errorData: AIAgentError = await response.json().catch(() => ({
                    error: { code: 'UNKNOWN', message: `HTTP ${response.status}: ${response.statusText}` }
                }));
                throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
            }

            const data: AIAgentListResponse = await response.json();
            return data;
        } catch (error) {
            console.error('AI Agents API error:', error);
            throw error;
        }
    }

    /**
     * Get a specific AI Agent by ID
     */
    async getAgent(agentId: string): Promise<AIAgent> {
        if (!this.accessToken) {
            throw new Error('Access token is required. Please authenticate first.');
        }

        try {
            const url = `${this.baseUrl}/agents/${agentId}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'X-API-Key': import.meta.env.VITE_ADOBE_CLIENT_ID || '',
                },
            });

            if (!response.ok) {
                const errorData: AIAgentError = await response.json().catch(() => ({
                    error: { code: 'UNKNOWN', message: `HTTP ${response.status}: ${response.statusText}` }
                }));
                throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
            }

            const data: AIAgent = await response.json();
            return data;
        } catch (error) {
            console.error('AI Agents API error:', error);
            throw error;
        }
    }

    /**
     * Send a message to an AI Agent
     */
    async sendMessage(request: AIAgentRequest): Promise<AIAgentResponse> {
        if (!this.accessToken) {
            throw new Error('Access token is required. Please authenticate first.');
        }

        try {
            const url = `${this.baseUrl}/agents/${request.agentId}/chat`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'X-API-Key': import.meta.env.VITE_ADOBE_CLIENT_ID || '',
                },
                body: JSON.stringify({
                    message: request.message,
                    context: request.context,
                    stream: request.stream || false,
                }),
            });

            if (!response.ok) {
                const errorData: AIAgentError = await response.json().catch(() => ({
                    error: { code: 'UNKNOWN', message: `HTTP ${response.status}: ${response.statusText}` }
                }));
                throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
            }

            const data: AIAgentResponse = await response.json();
            return data;
        } catch (error) {
            console.error('AI Agents API error:', error);
            throw error;
        }
    }

    /**
     * Get conversation history for an agent
     */
    async getConversation(conversationId: string): Promise<AIAgentConversation> {
        if (!this.accessToken) {
            throw new Error('Access token is required. Please authenticate first.');
        }

        try {
            const url = `${this.baseUrl}/conversations/${conversationId}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'X-API-Key': import.meta.env.VITE_ADOBE_CLIENT_ID || '',
                },
            });

            if (!response.ok) {
                const errorData: AIAgentError = await response.json().catch(() => ({
                    error: { code: 'UNKNOWN', message: `HTTP ${response.status}: ${response.statusText}` }
                }));
                throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
            }

            const data: AIAgentConversation = await response.json();
            return data;
        } catch (error) {
            console.error('AI Agents API error:', error);
            throw error;
        }
    }
}

export default AIAgentsClient;

