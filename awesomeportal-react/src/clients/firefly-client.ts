/**
 * Adobe Firefly API Client
 * Handles communication with Adobe Firefly API for image generation
 */

export interface FireflyImageGenerationRequest {
    prompt: string;
    numImages?: number;
    size?: '1024x1024' | '1152x896' | '896x1152' | '1344x768' | '768x1344';
    aspectRatio?: string;
    style?: string;
}

export interface FireflyImageGenerationResponse {
    images: Array<{
        id: string;
        url: string;
        seed: number;
    }>;
    prompt: string;
    model: string;
}

export interface FireflyError {
    error: {
        code: string;
        message: string;
    };
}

export class FireflyClient {
    private baseUrl: string;
    private accessToken: string | null;

    constructor(accessToken?: string) {
        // Adobe Firefly API endpoint
        this.baseUrl = 'https://firefly-api.adobe.io/v2/images/generate';
        this.accessToken = accessToken || null;
    }

    /**
     * Set the access token for API authentication
     */
    setAccessToken(token: string): void {
        this.accessToken = token;
    }

    /**
     * Generate images using Adobe Firefly
     */
    async generateImages(request: FireflyImageGenerationRequest): Promise<FireflyImageGenerationResponse> {
        if (!this.accessToken) {
            throw new Error('Access token is required. Please authenticate first.');
        }

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json',
                    'X-API-Key': import.meta.env.VITE_ADOBE_CLIENT_ID || '',
                },
                body: JSON.stringify({
                    prompt: request.prompt,
                    numImages: request.numImages || 1,
                    size: request.size || '1024x1024',
                    aspectRatio: request.aspectRatio,
                    style: request.style,
                }),
            });

            if (!response.ok) {
                const errorData: FireflyError = await response.json();
                throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
            }

            const data: FireflyImageGenerationResponse = await response.json();
            return data;
        } catch (error) {
            console.error('Firefly API error:', error);
            throw error;
        }
    }

    /**
     * Get available styles/models
     */
    async getStyles(): Promise<string[]> {
        // Placeholder - implement based on Firefly API documentation
        return [
            'photographic',
            'digital-art',
            'anime',
            'cinematic',
            '3d-render',
            'illustration',
        ];
    }
}

export default FireflyClient;

