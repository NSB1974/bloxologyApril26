const API_SERVER_URL = import.meta.env.VITE_API_URL || "/hcgi/api";

const apiServerClient = {
    fetch: async (url, options = {}) => {
        const response = await window.fetch(API_SERVER_URL + url, options);

        // Override .json() so every call site is protected against empty / invalid bodies
        const originalJson = response.json.bind(response);
        let bodyText = null;
        let bodyConsumed = false;

        response.json = async () => {
            if (!bodyConsumed) {
                bodyText = await response.clone().text();
                bodyConsumed = true;
            }
            if (!bodyText) {
                throw new Error(
                    'The API returned an empty response. Make sure the server is running and try again.'
                );
            }
            try {
                return JSON.parse(bodyText);
            } catch (_) {
                throw new Error(
                    'The API returned an invalid response. Make sure the server is running and try again.'
                );
            }
        };

        return response;
    }
};

export default apiServerClient;

export { apiServerClient };
