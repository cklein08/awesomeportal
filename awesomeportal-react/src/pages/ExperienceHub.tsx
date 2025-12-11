import React, { useState, useEffect } from 'react';
import { ExperienceHubClient, type ExperienceHubContent, type ExperienceHubListRequest } from '../clients/experience-hub-client';
import './ExperienceHub.css';

interface ExperienceHubProps {
    onBack?: () => void;
}

const ExperienceHub: React.FC<ExperienceHubProps> = ({ onBack }) => {
    const [content, setContent] = useState<ExperienceHubContent[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [hubClient, setHubClient] = useState<ExperienceHubClient | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [contentType, setContentType] = useState<'all' | 'page' | 'fragment' | 'experience' | 'asset'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
    const [totalItems, setTotalItems] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const itemsPerPage = 12;

    useEffect(() => {
        // Initialize Experience Hub client with access token from localStorage
        const accessToken = localStorage.getItem('accessToken');
        const hubId = import.meta.env.VITE_EXPERIENCE_HUB_ID || null;
        
        if (accessToken) {
            const client = new ExperienceHubClient(accessToken, hubId || undefined);
            setHubClient(client);
        } else {
            setError('Please sign in to use Adobe Experience Hub');
        }
    }, []);

    useEffect(() => {
        if (hubClient) {
            loadContent();
        }
    }, [hubClient, contentType, statusFilter, currentPage, searchQuery]);

    const loadContent = async () => {
        if (!hubClient) return;

        setLoading(true);
        setError(null);

        try {
            const request: ExperienceHubListRequest = {
                type: contentType === 'all' ? undefined : contentType,
                status: statusFilter === 'all' ? undefined : statusFilter,
                limit: itemsPerPage,
                offset: currentPage * itemsPerPage,
                searchQuery: searchQuery || undefined,
            };

            const response = await hubClient.listContent(request);
            setContent(response.items);
            setTotalItems(response.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load content');
            console.error('Experience Hub error:', err);
            // Set mock data for development/demo purposes
            setContent(getMockContent());
            setTotalItems(8);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(0);
        loadContent();
    };

    const handleContentClick = (item: ExperienceHubContent) => {
        if (item.url) {
            window.open(item.url, '_blank');
        } else {
            console.log('Opening content:', item.id);
            // TODO: Implement content detail view
        }
    };

    const getMockContent = (): ExperienceHubContent[] => {
        // Mock data for development/demo
        return [
            {
                id: '1',
                title: 'Homepage Experience',
                description: 'Main landing page experience',
                type: 'experience',
                status: 'published',
                createdDate: '2024-01-15',
                author: 'John Doe',
            },
            {
                id: '2',
                title: 'Product Showcase Fragment',
                description: 'Reusable product showcase component',
                type: 'fragment',
                status: 'published',
                createdDate: '2024-01-20',
                author: 'Jane Smith',
            },
            {
                id: '3',
                title: 'About Us Page',
                description: 'Company information page',
                type: 'page',
                status: 'draft',
                createdDate: '2024-02-01',
                author: 'Bob Johnson',
            },
            {
                id: '4',
                title: 'Hero Banner Asset',
                description: 'Main hero banner image',
                type: 'asset',
                status: 'published',
                createdDate: '2024-02-10',
                author: 'Alice Williams',
            },
        ];
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="experience-hub-container">
            {onBack && (
                <button className="experience-hub-back-btn" onClick={onBack}>
                    ← Back to Grid
                </button>
            )}
            
            <div className="experience-hub-header">
                <h1>Adobe Experience Hub</h1>
                <p className="experience-hub-subtitle">Manage and browse your content experiences</p>
            </div>

            <div className="experience-hub-controls">
                <form onSubmit={handleSearch} className="experience-hub-search-form">
                    <input
                        type="text"
                        className="experience-hub-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search content..."
                    />
                    <button type="submit" className="experience-hub-search-btn">
                        Search
                    </button>
                </form>

                <div className="experience-hub-filters">
                    <div className="experience-hub-filter-group">
                        <label htmlFor="content-type-filter">Content Type</label>
                        <select
                            id="content-type-filter"
                            value={contentType}
                            onChange={(e) => {
                                setContentType(e.target.value as typeof contentType);
                                setCurrentPage(0);
                            }}
                        >
                            <option value="all">All Types</option>
                            <option value="page">Pages</option>
                            <option value="fragment">Fragments</option>
                            <option value="experience">Experiences</option>
                            <option value="asset">Assets</option>
                        </select>
                    </div>

                    <div className="experience-hub-filter-group">
                        <label htmlFor="status-filter">Status</label>
                        <select
                            id="status-filter"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as typeof statusFilter);
                                setCurrentPage(0);
                            }}
                        >
                            <option value="all">All Status</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="experience-hub-error">
                        {error}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="experience-hub-loading">
                    <div className="experience-hub-spinner"></div>
                    <p>Loading content...</p>
                </div>
            ) : content.length > 0 ? (
                <>
                    <div className="experience-hub-content-grid">
                        {content.map((item) => (
                            <div
                                key={item.id}
                                className="experience-hub-content-card"
                                onClick={() => handleContentClick(item)}
                            >
                                {item.thumbnail && (
                                    <img
                                        src={item.thumbnail}
                                        alt={item.title}
                                        className="experience-hub-thumbnail"
                                    />
                                )}
                                <div className="experience-hub-content-info">
                                    <div className="experience-hub-content-type">{item.type}</div>
                                    <h3 className="experience-hub-content-title">{item.title}</h3>
                                    {item.description && (
                                        <p className="experience-hub-content-description">{item.description}</p>
                                    )}
                                    <div className="experience-hub-content-meta">
                                        {item.status && (
                                            <span className={`experience-hub-status experience-hub-status-${item.status}`}>
                                                {item.status}
                                            </span>
                                        )}
                                        {item.author && (
                                            <span className="experience-hub-author">By {item.author}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="experience-hub-pagination">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                disabled={currentPage === 0}
                                className="experience-hub-pagination-btn"
                            >
                                Previous
                            </button>
                            <span className="experience-hub-pagination-info">
                                Page {currentPage + 1} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                                disabled={currentPage >= totalPages - 1}
                                className="experience-hub-pagination-btn"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="experience-hub-empty">
                    <p>No content found. Try adjusting your filters or search query.</p>
                </div>
            )}
        </div>
    );
};

export default ExperienceHub;

