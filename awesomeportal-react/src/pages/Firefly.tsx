import React, { useState, useEffect } from 'react';
import { FireflyClient, type FireflyImageGenerationRequest, type FireflyImageGenerationResponse } from '../clients/firefly-client';
import './Firefly.css';

interface FireflyProps {
    onBack?: () => void;
}

const Firefly: React.FC<FireflyProps> = ({ onBack }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [generatedImages, setGeneratedImages] = useState<FireflyImageGenerationResponse['images']>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fireflyClient, setFireflyClient] = useState<FireflyClient | null>(null);
    const [size, setSize] = useState<'1024x1024' | '1152x896' | '896x1152' | '1344x768' | '768x1344'>('1024x1024');
    const [numImages, setNumImages] = useState<number>(1);

    useEffect(() => {
        // Initialize Firefly client with access token from localStorage
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            const client = new FireflyClient(accessToken);
            setFireflyClient(client);
        } else {
            setError('Please sign in to use Adobe Firefly');
        }
    }, []);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        if (!fireflyClient) {
            setError('Firefly client not initialized. Please sign in.');
            return;
        }

        setLoading(true);
        setError(null);
        setGeneratedImages([]);

        try {
            const request: FireflyImageGenerationRequest = {
                prompt: prompt.trim(),
                numImages,
                size,
            };

            const response = await fireflyClient.generateImages(request);
            setGeneratedImages(response.images);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate images');
            console.error('Firefly generation error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (imageUrl: string, imageId: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `firefly-${imageId}.png`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download image');
        }
    };

    return (
        <div className="firefly-container">
            {onBack && (
                <button className="firefly-back-btn" onClick={onBack}>
                    ← Back to Grid
                </button>
            )}
            <div className="firefly-header">
                <h1>Adobe Firefly</h1>
                <p className="firefly-subtitle">Generate images using AI</p>
            </div>

            <div className="firefly-controls">
                <div className="firefly-input-group">
                    <label htmlFor="prompt-input">Prompt</label>
                    <textarea
                        id="prompt-input"
                        className="firefly-prompt-input"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the image you want to generate..."
                        rows={4}
                        disabled={loading}
                    />
                </div>

                <div className="firefly-options">
                    <div className="firefly-option-group">
                        <label htmlFor="size-select">Size</label>
                        <select
                            id="size-select"
                            value={size}
                            onChange={(e) => setSize(e.target.value as typeof size)}
                            disabled={loading}
                        >
                            <option value="1024x1024">1024x1024 (Square)</option>
                            <option value="1152x896">1152x896 (Landscape)</option>
                            <option value="896x1152">896x1152 (Portrait)</option>
                            <option value="1344x768">1344x768 (Wide)</option>
                            <option value="768x1344">768x1344 (Tall)</option>
                        </select>
                    </div>

                    <div className="firefly-option-group">
                        <label htmlFor="num-images">Number of Images</label>
                        <input
                            id="num-images"
                            type="number"
                            min="1"
                            max="4"
                            value={numImages}
                            onChange={(e) => setNumImages(parseInt(e.target.value) || 1)}
                            disabled={loading}
                        />
                    </div>
                </div>

                <button
                    className="firefly-generate-btn"
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                >
                    {loading ? 'Generating...' : 'Generate Images'}
                </button>

                {error && (
                    <div className="firefly-error">
                        {error}
                    </div>
                )}
            </div>

            {generatedImages.length > 0 && (
                <div className="firefly-results">
                    <h2>Generated Images</h2>
                    <div className="firefly-image-grid">
                        {generatedImages.map((image) => (
                            <div key={image.id} className="firefly-image-card">
                                <img
                                    src={image.url}
                                    alt={`Generated image ${image.id}`}
                                    className="firefly-generated-image"
                                />
                                <div className="firefly-image-actions">
                                    <button
                                        className="firefly-download-btn"
                                        onClick={() => handleDownload(image.url, image.id)}
                                    >
                                        Download
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Firefly;

