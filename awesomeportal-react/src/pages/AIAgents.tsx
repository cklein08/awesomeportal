import React, { useState, useEffect, useRef } from 'react';
import { AIAgentsClient, type AIAgent, type AIAgentMessage, type AIAgentRequest, type AIAgentListRequest } from '../clients/ai-agents-client';
import './AIAgents.css';

interface AIAgentsProps {
    onBack?: () => void;
}

const AIAgents: React.FC<AIAgentsProps> = ({ onBack }) => {
    const [agents, setAgents] = useState<AIAgent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
    const [messages, setMessages] = useState<AIAgentMessage[]>([]);
    const [inputMessage, setInputMessage] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingAgents, setLoadingAgents] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [agentsClient, setAgentsClient] = useState<AIAgentsClient | null>(null);
    const [agentTypeFilter, setAgentTypeFilter] = useState<'all' | 'assistant' | 'workflow' | 'automation' | 'custom'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'training' | 'error'>('all');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Initialize AI Agents client with access token from localStorage
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            const client = new AIAgentsClient(accessToken);
            setAgentsClient(client);
        } else {
            setError('Please sign in to use Adobe AI Agents');
        }
    }, []);

    useEffect(() => {
        if (agentsClient) {
            loadAgents();
        }
    }, [agentsClient, agentTypeFilter, statusFilter]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadAgents = async () => {
        if (!agentsClient) return;

        setLoadingAgents(true);
        setError(null);

        try {
            const request: AIAgentListRequest = {
                type: agentTypeFilter === 'all' ? undefined : agentTypeFilter,
                status: statusFilter === 'all' ? undefined : statusFilter,
                limit: 50,
            };

            const response = await agentsClient.listAgents(request);
            setAgents(response.agents);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load agents');
            console.error('AI Agents error:', err);
            // Set mock data for development/demo purposes
            setAgents(getMockAgents());
        } finally {
            setLoadingAgents(false);
        }
    };

    const getMockAgents = (): AIAgent[] => {
        return [
            {
                id: '1',
                name: 'Content Assistant',
                description: 'Helps create and optimize content',
                type: 'assistant',
                status: 'active',
                capabilities: ['content-generation', 'optimization', 'seo'],
            },
            {
                id: '2',
                name: 'Asset Workflow Agent',
                description: 'Automates asset processing workflows',
                type: 'workflow',
                status: 'active',
                capabilities: ['asset-processing', 'automation'],
            },
            {
                id: '3',
                name: 'Analytics Agent',
                description: 'Provides insights and analytics',
                type: 'assistant',
                status: 'active',
                capabilities: ['analytics', 'reporting'],
            },
            {
                id: '4',
                name: 'Marketing Automation',
                description: 'Automates marketing campaigns',
                type: 'automation',
                status: 'active',
                capabilities: ['campaign-management', 'automation'],
            },
        ];
    };

    const handleAgentSelect = (agent: AIAgent) => {
        setSelectedAgent(agent);
        setMessages([
            {
                role: 'system',
                content: `You are now chatting with ${agent.name}. ${agent.description || ''}`,
            },
        ]);
        setInputMessage('');
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !selectedAgent || !agentsClient) return;

        const userMessage: AIAgentMessage = {
            role: 'user',
            content: inputMessage,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setLoading(true);
        setError(null);

        try {
            const request: AIAgentRequest = {
                agentId: selectedAgent.id,
                message: inputMessage,
            };

            const response = await agentsClient.sendMessage(request);

            const assistantMessage: AIAgentMessage = {
                role: 'assistant',
                content: response.message,
                timestamp: new Date().toISOString(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message');
            // Add mock response for demo
            const mockResponse: AIAgentMessage = {
                role: 'assistant',
                content: `I understand you're asking about "${inputMessage}". As ${selectedAgent.name}, I'm here to help. This is a demo response.`,
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, mockResponse]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="ai-agents-container">
            {onBack && (
                <button className="ai-agents-back-btn" onClick={onBack}>
                    ← Back to Grid
                </button>
            )}

            <div className="ai-agents-header">
                <h1>Adobe AI Agents</h1>
                <p className="ai-agents-subtitle">Interact with intelligent agents</p>
            </div>

            <div className="ai-agents-layout">
                {/* Agents Sidebar */}
                <div className="ai-agents-sidebar">
                    <div className="ai-agents-filters">
                        <div className="ai-agents-filter-group">
                            <label htmlFor="type-filter">Type</label>
                            <select
                                id="type-filter"
                                value={agentTypeFilter}
                                onChange={(e) => setAgentTypeFilter(e.target.value as typeof agentTypeFilter)}
                            >
                                <option value="all">All Types</option>
                                <option value="assistant">Assistants</option>
                                <option value="workflow">Workflows</option>
                                <option value="automation">Automations</option>
                                <option value="custom">Custom</option>
                            </select>
                        </div>

                        <div className="ai-agents-filter-group">
                            <label htmlFor="status-filter">Status</label>
                            <select
                                id="status-filter"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="training">Training</option>
                                <option value="error">Error</option>
                            </select>
                        </div>
                    </div>

                    {loadingAgents ? (
                        <div className="ai-agents-loading">Loading agents...</div>
                    ) : (
                        <div className="ai-agents-list">
                            {agents.map((agent) => (
                                <div
                                    key={agent.id}
                                    className={`ai-agents-agent-card ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
                                    onClick={() => handleAgentSelect(agent)}
                                >
                                    <div className="ai-agents-agent-header">
                                        <h3 className="ai-agents-agent-name">{agent.name}</h3>
                                        <span className={`ai-agents-status ai-agents-status-${agent.status}`}>
                                            {agent.status}
                                        </span>
                                    </div>
                                    {agent.description && (
                                        <p className="ai-agents-agent-description">{agent.description}</p>
                                    )}
                                    <div className="ai-agents-agent-type">{agent.type}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chat Area */}
                <div className="ai-agents-chat-area">
                    {selectedAgent ? (
                        <>
                            <div className="ai-agents-chat-header">
                                <h2>{selectedAgent.name}</h2>
                                {selectedAgent.description && (
                                    <p className="ai-agents-chat-description">{selectedAgent.description}</p>
                                )}
                            </div>

                            <div className="ai-agents-messages">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`ai-agents-message ai-agents-message-${message.role}`}
                                    >
                                        <div className="ai-agents-message-content">
                                            {message.content}
                                        </div>
                                        {message.timestamp && (
                                            <div className="ai-agents-message-time">
                                                {new Date(message.timestamp).toLocaleTimeString()}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {loading && (
                                    <div className="ai-agents-message ai-agents-message-assistant">
                                        <div className="ai-agents-typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {error && (
                                <div className="ai-agents-error">
                                    {error}
                                </div>
                            )}

                            <div className="ai-agents-input-area">
                                <textarea
                                    className="ai-agents-input"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your message..."
                                    rows={3}
                                    disabled={loading}
                                />
                                <button
                                    className="ai-agents-send-btn"
                                    onClick={handleSendMessage}
                                    disabled={loading || !inputMessage.trim()}
                                >
                                    Send
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="ai-agents-placeholder">
                            <p>Select an agent from the sidebar to start a conversation</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIAgents;

