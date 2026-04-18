import { lazy, ComponentType } from "react";

/**
 * A wrapper around React.lazy that handles chunk load errors (404s)
 * which occur when a new version is deployed but the user is browsing an old version.
 * 
 * If a dynamic import fails, this will reload the page once to fetch the fresh assets.
 */
export const lazyWithRetry = <T extends ComponentType<any>>(
    factory: () => Promise<{ default: T }>
) => {
    return lazy(async () => {
        const pageHasAlreadyBeenForceRefreshed = JSON.parse(
            window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
        );

        try {
            const component = await factory();
            window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
            return component;
        } catch (error: any) {
            if (!pageHasAlreadyBeenForceRefreshed) {
                // Assuming that the error is because of version mismatch,
                // we force a page refresh to get the new files.
                console.log('Chunk load error detected, forcing refresh...');
                window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');

                // Nuclear option: Unregister SW to ensure fresh index.html
                if ('serviceWorker' in navigator) {
                    try {
                        const validations = await navigator.serviceWorker.getRegistrations();
                        for (const registration of validations) {
                            await registration.unregister();
                        }
                    } catch (e) {
                        console.error('SW unregister failed:', e);
                    }
                }

                const url = new URL(window.location.href);
                url.searchParams.set('v', Date.now().toString());
                window.location.href = url.toString();

                // Return a never-resolving promise or a dummy component to prevent React form crashing
                // before the reload happens.
                return new Promise(() => { });
            }

            // If we already reloaded and it still fails, it's a real error.
            throw error;
        }
    });
};
