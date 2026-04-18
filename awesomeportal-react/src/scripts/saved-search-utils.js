/**
 * Placeholder utility for building saved search URLs
 * TODO: Implement full functionality when saved search feature is finalized
 */

/**
 * Builds a URL from a saved search object
 * @param {Object} savedSearch - The saved search object with search parameters
 * @param {string} savedSearch.id - Unique identifier for the saved search
 * @param {string} savedSearch.name - Name of the saved search
 * @param {string} savedSearch.searchTerm - The search query term
 * @param {string[][]} savedSearch.facetFilters - Array of facet filter arrays
 * @param {string[]} savedSearch.numericFilters - Array of numeric filter strings
 * @returns {string} The constructed URL with search parameters
 */
function buildSavedSearchUrl(savedSearch) {
    if (!savedSearch) {
        return window.location.href;
    }

    // Get the current base URL
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();

    // Add search term if present
    if (savedSearch.searchTerm) {
        params.set('fulltext', savedSearch.searchTerm);
    }

    // Add facet filters if present
    if (savedSearch.facetFilters && savedSearch.facetFilters.length > 0) {
        params.set('facetFilters', encodeURIComponent(JSON.stringify(savedSearch.facetFilters)));
    }

    // Add numeric filters if present
    if (savedSearch.numericFilters && savedSearch.numericFilters.length > 0) {
        params.set('numericFilters', encodeURIComponent(JSON.stringify(savedSearch.numericFilters)));
    }

    // Construct the full URL
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

export default buildSavedSearchUrl;

