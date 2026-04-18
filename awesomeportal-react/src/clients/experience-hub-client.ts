/**
 * Adobe Experience Hub API Client
 * Handles communication with Adobe Experience Hub API for content management
 */

export interface ExperienceHubContent {
    id: string;
    title: string;
    description?: string;
    type: 'page' | 'fragment' | 'experience' | 'asset';
    url?: string;
    thumbnail?: string;
    createdDate?: string;
    modifiedDate?: string;
    author?: string;
    status?: 'published' | 'draft' | 'archived';
}

export interface ExperienceHubListRequest {
    type?: 'page' | 'fragment' | 'experience' | 'asset' | 'all';
    status?: 'published' | 'draft' | 'archived' | 'all';
    limit?: number;
    offset?: number;
    searchQuery?: string;
}

export interface ExperienceHubListResponse {
    items: ExperienceHubContent[];
    total: number;
    limit: number;
    offset: number;
}

export interface ExperienceHubError {
    error: {
        code: string;
        message: string;
    };
}

export class ExperienceHubClient {
    private baseUrl: string;
    private accessToken: string | null;
    private hubId: string | null;

    constructor(accessToken?: string, hubId?: string) {
        // Adobe Experience Hub API endpoint
        // Note: Update this URL based on your actual Experience Hub instance
        this.baseUrl = 'https://experience.adobe.com/api/hub';
        this.accessToken = accessToken || null;
        this.hubId = hubId || null;
    }

    /**
     * Set the access token for API authentication
     */
    setAccessToken(token: string): void {
        this.accessToken = token;
    }

    /**
     * Set the Experience Hub ID
     */
    setHubId(hubId: string): void {
        this.hubId = hubId;
    }

    /**
     * Get list of content from Experience Hub
     */
    async listContent(request: ExperienceHubListRequest = {}): Promise<ExperienceHubListResponse> {
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

            const url = `${this.baseUrl}${this.hubId ? `/${this.hubId}` : ''}/content?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'X-API-Key': import.meta.env.VITE_ADOBE_CLIENT_ID || '',
                },
            });

            if (!response.ok) {
                const errorData: ExperienceHubError = await response.json().catch(() => ({
                    error: { code: 'UNKNOWN', message: `HTTP ${response.status}: ${response.statusText}` }
                }));
                throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
            }

            const data: ExperienceHubListResponse = await response.json();
            return data;
        } catch (error) {
            console.error('Experience Hub API error:', error);
            throw error;
        }
    }

    /**
     * Get a specific content item by ID
     */
    async getContent(contentId: string): Promise<ExperienceHubContent> {
        if (!this.accessToken) {
            throw new Error('Access token is required. Please authenticate first.');
        }

        try {
            const url = `${this.baseUrl}${this.hubId ? `/${this.hubId}` : ''}/content/${contentId}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'X-API-Key': import.meta.env.VITE_ADOBE_CLIENT_ID || '',
                },
            });

            if (!response.ok) {
                const errorData: ExperienceHubError = await response.json().catch(() => ({
                    error: { code: 'UNKNOWN', message: `HTTP ${response.status}: ${response.statusText}` }
                }));
                throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
            }

            const data: ExperienceHubContent = await response.json();
            return data;
        } catch (error) {
            console.error('Experience Hub API error:', error);
            throw error;
        }
    }

    /**
     * Search content in Experience Hub
     */
    async searchContent(searchQuery: string, limit: number = 20): Promise<ExperienceHubListResponse> {
        return this.listContent({
            searchQuery,
            limit,
            type: 'all',
            status: 'all',
        });
    }
}

export default ExperienceHubClient;

