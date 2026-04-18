import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdobeSignInButtonProps } from '../types';
import { getAdobeClientId } from '../utils/config';
import { getPortalSpaRootHref, readPostImsReturnSettleMs } from '../utils/portalSession';

interface IMSConfig {
    clientId: string;
    redirectUri: string;
    scope: string;
    responseType: string;
}

/**
 * AdobeSignInButton
 * Renders a "Sign in with Adobe" button and handles IMS authentication flow.
 * Uses implicit flow with silent refresh for token renewal.
 * Props:
 *   - onAuthenticated: function(token) => void (called with Bearer token on success)
 *   - onSignOut: function() => void (called when user signs out)
 */
const AdobeSignInButton: React.FC<AdobeSignInButtonProps> = ({
    onAuthenticated,
    onSignOut,
    sessionActive,
    imsSession,
    imsBearerSignOutLabel,
}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [postAuthSettling, setPostAuthSettling] = useState(false);

    // IMS config for implicit flow - memoized to prevent unnecessary re-renders
    const imsConfig: IMSConfig = useMemo(() => ({
        clientId: getAdobeClientId(),
        redirectUri: window.location.href,
        scope: 'AdobeID,openid,read_organizations,additional_info.projectedProductContext',
        responseType: 'token', // Implicit flow - returns token directly
    }), []);

    // Silent refresh using hidden iframe
    const performSilentRefresh = useCallback(async (): Promise<string | null> => {
        return new Promise((resolve) => {
            // Create hidden iframe for silent refresh
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = `https://ims-na1.adobelogin.com/ims/authorize/v2?${new URLSearchParams({
                client_id: imsConfig.clientId,
                redirect_uri: imsConfig.redirectUri,
                scope: imsConfig.scope,
                response_type: imsConfig.responseType,
                prompt: 'none', // Silent refresh
            }).toString()}`;

            // Set up timeout
            const timeout = setTimeout(() => {
                cleanup();
                resolve(null);
            }, 10000); // 10 second timeout

            const cleanup = () => {
                clearTimeout(timeout);
                document.body.removeChild(iframe);
                window.removeEventListener('message', handleMessage);
            };

            const handleMessage = (event: MessageEvent) => {
                if (event.origin !== 'https://ims-na1.adobelogin.com') return;

                try {
                    const url = new URL(event.data);
                    const params = new URLSearchParams(url.hash.substring(1));
                    const accessToken = params.get('access_token');
                    const error = params.get('error');

                    cleanup();

                    if (error) {
                        resolve(null);
                        return;
                    }

                    if (accessToken) {
                        const token = `Bearer ${accessToken}`;
                        const expiresIn = params.get('expires_in');

                        // Update stored tokens
                        localStorage.setItem('accessToken', token);
                        const expiresAt = Date.now() + ((expiresIn ? parseInt(expiresIn) : 3600) * 1000);
                        localStorage.setItem('tokenExpiresAt', expiresAt.toString());

                        setIsAuthenticated(true);
                        if (onAuthenticated) {
                            onAuthenticated(token);
                        }

                        resolve(token);
                        return;
                    }
                } catch (err) {
                    console.error('Error parsing silent refresh response:', err);
                }

                resolve(null);
            };

            window.addEventListener('message', handleMessage);
            document.body.appendChild(iframe);
        });
    }, [imsConfig, onAuthenticated]);

    const replaceLocationAfterAuth = useCallback((target: string) => {
        const ms = readPostImsReturnSettleMs();
        if (ms <= 0) {
            window.location.replace(target);
            return;
        }
        setPostAuthSettling(true);
        window.setTimeout(() => {
            window.location.replace(target);
        }, ms);
    }, []);

    // Check if token is expired or about to expire (within 5 minutes)
    const isTokenExpired = useCallback((): boolean => {
        const expiresAt = localStorage.getItem('tokenExpiresAt');
        if (!expiresAt) return true;

        const expirationTime = parseInt(expiresAt);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds

        return now >= (expirationTime - fiveMinutes);
    }, []);

    // Auto-refresh token when it's about to expire
    const setupTokenRefresh = useCallback(() => {
        const expiresAt = localStorage.getItem('tokenExpiresAt');
        if (!expiresAt) return;

        const expirationTime = parseInt(expiresAt);
        const now = Date.now();
        const refreshTime = expirationTime - (5 * 60 * 1000); // Refresh 5 minutes before expiry
        const timeUntilRefresh = refreshTime - now;

        if (timeUntilRefresh > 0) {
            setTimeout(async () => {
                await performSilentRefresh();
            }, timeUntilRefresh);
        }
    }, [performSilentRefresh]);

    // Handle sign in with implicit flow
    const handleSignIn = (): void => {
        setError(null);
        setLoading(true);

        try {
            if (!imsConfig.clientId) {
                // Don't throw during development; surface an inline error and disable sign-in
                const msg = 'Adobe Client ID not configured. Please set VITE_ADOBE_CLIENT_ID environment variable.';
                console.warn(msg);
                setError(`Sign in failed: ${msg}`);
                setLoading(false);
                return;
            }

            const params = new URLSearchParams({
                client_id: imsConfig.clientId,
                redirect_uri: imsConfig.redirectUri,
                scope: imsConfig.scope,
                response_type: imsConfig.responseType,
            });

            const authUrl = `https://ims-na1.adobelogin.com/ims/authorize/v2?${params.toString()}`;

            // Land on SPA root (Vite `base`), not index.html, so the default route shows the portal grid.
            try {
                sessionStorage.setItem('postSignInRedirect', getPortalSpaRootHref());
            } catch (e) {
                // ignore session storage errors
            }

            // Direct redirect to Adobe IMS
            window.location.href = authUrl;

        } catch (error) {
            console.error('Sign in error:', error);
            setError(`Sign in failed: ${error instanceof Error ? error.message : String(error)}`);
            setLoading(false);
        }
    };

    // Handle sign out  
    const handleSignOut = (): void => {
        // Clear all tokens and state
        setIsAuthenticated(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('tokenExpiresAt');
        setError(null);

        if (onSignOut) {
            onSignOut();
        }
    };

    // On mount, check for token in URL hash or localStorage
    useEffect(() => {

        console.debug('[AdobeSignInButton] mount: url=', window.location.href);
        console.debug('[AdobeSignInButton] hash=', window.location.hash);
        console.debug('[AdobeSignInButton] search=', window.location.search);
        console.debug('[AdobeSignInButton] pathname=', window.location.pathname);



        // Check for access token in URL hash (from Adobe IMS redirect)
        if (window.location.hash) {

            try {
                console.debug('[AdobeSignInButton] detected hash, attempting parse');
                const params = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = params.get('access_token');
                const expiresIn = params.get('expires_in');
                const error = params.get('error');
                const errorDescription = params.get('error_description');



                if (error) {
                    setError(`OAuth error: ${error} - ${errorDescription || 'No description'}`);
                    setLoading(false);
                    return;
                }

                if (accessToken) {
                    const token = `Bearer ${accessToken}`;

                    setIsAuthenticated(true);
                    localStorage.setItem('accessToken', token);

                    // Handle token expiration
                    if (expiresIn) {
                        const expiresAt = Date.now() + (parseInt(expiresIn) * 1000);
                        localStorage.setItem('tokenExpiresAt', expiresAt.toString());
                    } else {
                        // Default 1 hour expiration if not provided
                        const expiresAt = Date.now() + (60 * 60 * 1000);
                        localStorage.setItem('tokenExpiresAt', expiresAt.toString());
                    }

                    if (onAuthenticated) {
                        onAuthenticated(token);
                    }

                    // Setup auto-refresh
                    setupTokenRefresh();
                    setLoading(false);

                    // Redirect to clean URL (no token in hash/query); prefer app root (Vite `base`, e.g. /portal/)
                    const cleanTarget = (() => {
                        try {
                            sessionStorage.removeItem('postSignInRedirectApp');
                            const stored = sessionStorage.getItem('postSignInRedirect');
                            sessionStorage.removeItem('postSignInRedirect');
                            if (stored) {
                                const u = new URL(stored);
                                u.hash = '';
                                u.search = '';
                                return u.toString();
                            }
                        } catch {
                            // ignore
                        }
                        return getPortalSpaRootHref();
                    })();
                    replaceLocationAfterAuth(cleanTarget);
                    return;
                }
            } catch (error) {
                console.error('Error parsing hash:', error);
                setError('Error parsing authentication response');
                setLoading(false);
            }
        }

        // Fallback: some providers may return token in query string
        if (window.location.search && window.location.search.includes('access_token=')) {
            try {
                console.debug('[AdobeSignInButton] detected access_token in search, attempting parse');
                const params = new URLSearchParams(window.location.search.substring(1));
                const accessToken = params.get('access_token');
                const expiresIn = params.get('expires_in');
                const error = params.get('error');
                const errorDescription = params.get('error_description');

                if (error) {
                    setError(`OAuth error: ${error} - ${errorDescription || 'No description'}`);
                    setLoading(false);
                }

                if (accessToken) {
                    const token = `Bearer ${accessToken}`;

                    setIsAuthenticated(true);
                    localStorage.setItem('accessToken', token);

                    // Handle token expiration
                    if (expiresIn) {
                        const expiresAt = Date.now() + (parseInt(expiresIn) * 1000);
                        localStorage.setItem('tokenExpiresAt', expiresAt.toString());
                    } else {
                        const expiresAt = Date.now() + (60 * 60 * 1000);
                        localStorage.setItem('tokenExpiresAt', expiresAt.toString());
                    }

                    if (onAuthenticated) {
                        onAuthenticated(token);
                    }

                    // Setup auto-refresh
                    setupTokenRefresh();
                    setLoading(false);

                    // Redirect to clean URL; prefer app root from Vite `base`
                    const cleanTarget = (() => {
                        try {
                            sessionStorage.removeItem('postSignInRedirectApp');
                            const stored = sessionStorage.getItem('postSignInRedirect');
                            sessionStorage.removeItem('postSignInRedirect');
                            if (stored) {
                                const u = new URL(stored);
                                u.hash = '';
                                u.search = '';
                                return u.toString();
                            }
                        } catch {
                            // ignore
                        }
                        return getPortalSpaRootHref();
                    })();
                    replaceLocationAfterAuth(cleanTarget);
                    return;
                }
            } catch (error) {
                console.error('Error parsing access_token from search:', error);
                setError('Error parsing authentication response from URL');
                setLoading(false);
            }
        }

        // WORKAROUND: Check if access_token appears in pathname instead of hash
        // This handles cases where the OAuth redirect incorrectly puts tokens in the path
        if (window.location.pathname.includes('access_token')) {
            try {
                // Extract the token part from the pathname (everything after the first 'access_token=')
                const pathString = window.location.pathname;
                const tokenStartIndex = pathString.indexOf('access_token=');

                if (tokenStartIndex !== -1) {
                    // Get everything from 'access_token=' onwards
                    const tokenString = pathString.substring(tokenStartIndex);


                    const params = new URLSearchParams(tokenString);
                    const accessToken = params.get('access_token');
                    const expiresIn = params.get('expires_in');
                    const error = params.get('error');
                    const errorDescription = params.get('error_description');



                    if (error) {
                        setError(`OAuth error: ${error} - ${errorDescription || 'No description'}`);
                        setLoading(false);
                        return;
                    }

                    if (accessToken) {
                        const token = `Bearer ${accessToken}`;

                        setIsAuthenticated(true);
                        localStorage.setItem('accessToken', token);

                        // Handle token expiration
                        if (expiresIn) {
                            const expiresAt = Date.now() + (parseInt(expiresIn) * 1000);
                            localStorage.setItem('tokenExpiresAt', expiresAt.toString());
                        } else {
                            // Default 1 hour expiration if not provided
                            const expiresAt = Date.now() + (60 * 60 * 1000);
                            localStorage.setItem('tokenExpiresAt', expiresAt.toString());
                        }

                        if (onAuthenticated) {
                            onAuthenticated(token);
                        }

                        // Setup auto-refresh
                        setupTokenRefresh();
                        setLoading(false);

                        // Redirect to clean URL; prefer app root from Vite `base`
                        const cleanTarget = (() => {
                            try {
                                sessionStorage.removeItem('postSignInRedirectApp');
                                const stored = sessionStorage.getItem('postSignInRedirect');
                                sessionStorage.removeItem('postSignInRedirect');
                                if (stored) {
                                    const u = new URL(stored);
                                    u.hash = '';
                                    u.search = '';
                                    return u.toString();
                                }
                            } catch {
                                // ignore
                            }
                            return getPortalSpaRootHref();
                        })();
                        replaceLocationAfterAuth(cleanTarget);
                        return;
                    }
                }
            } catch (error) {
                console.error('Error parsing access_token from pathname:', error);
                setError('Error parsing authentication response from URL');
                setLoading(false);
            }
        }

        // Check for existing token in localStorage
        const checkExistingToken = async () => {
            const storedToken = localStorage.getItem('accessToken');
            const storedExpiresAt = localStorage.getItem('tokenExpiresAt');

            if (storedToken && storedExpiresAt) {
                if (isTokenExpired()) {
                    const refreshedToken = await performSilentRefresh();

                    if (refreshedToken) {
                        setupTokenRefresh();
                    } else {
                        // Silent refresh failed, clear expired token
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('tokenExpiresAt');
                        setIsAuthenticated(false);
                    }
                } else {
                    // Token is not expired, use it directly
                    setIsAuthenticated(true);
                    if (onAuthenticated) {
                        onAuthenticated(storedToken);
                    }
                    setupTokenRefresh();
                }
            }

            setLoading(false);
        };

        checkExistingToken();
    }, [onAuthenticated, isTokenExpired, performSilentRefresh, setupTokenRefresh, replaceLocationAfterAuth]);

    const signedIn = sessionActive !== undefined ? sessionActive : isAuthenticated;
    const imsBearerSession = imsSession === true;

    return (
        <>
            {postAuthSettling ? (
                <div
                    className="ims-auth-settling-overlay"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 2147483646,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 24,
                        background: 'rgba(0, 20, 8, 0.82)',
                        color: '#fff',
                        textAlign: 'center',
                        fontFamily: 'system-ui, sans-serif',
                    }}
                    role="status"
                    aria-live="polite"
                >
                    <p style={{ maxWidth: '26rem', fontSize: '1.05rem', lineHeight: 1.5, margin: 0 }}>
                        Completing sign-in… If Adobe showed an organization or profile step, you can finish there before we open the portal. Taking you in shortly.
                    </p>
                </div>
            ) : null}
            <button
                type="button"
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
                style={{
                    backgroundColor: 'var(--primary-color)',
                    color: '#fff',
                    opacity: loading ? 0.7 : 1
                }}
                onClick={signedIn ? handleSignOut : handleSignIn}
                disabled={loading || !imsConfig.clientId}
            >
                {loading
                    ? signedIn
                        ? 'Signing out...'
                        : 'Signing in...'
                    : signedIn
                        ? imsBearerSession
                            ? imsBearerSignOutLabel?.trim() || 'Sign Out with Adobe'
                            : 'Sign out'
                        : 'Sign in with Adobe'}
            </button>
            {error && (
                <div className="mt-2 text-sm text-red-600">{error}</div>
            )}
        </>
    );
};

export default AdobeSignInButton; 