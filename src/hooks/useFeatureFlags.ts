import { useStoreSettings } from './useStoreSettings';

/**
 * Centralized hook for feature flags
 * Provides consistent access to feature toggle states throughout the app
 */
export const useFeatureFlags = () => {
    const { data: settings, isLoading } = useStoreSettings();

    return {
        // Feature toggles - default to true (enabled) if not explicitly disabled
        isPointsEnabled: settings?.points_system_enabled !== false,
        isFreeGamesEnabled: settings?.free_games_enabled !== false,
        isHelpTooltipsEnabled: settings?.help_tooltips_enabled !== false,

        // Additional settings
        tariffDisplayMode: settings?.tariff_display_mode || 'cards',

        // Loading state
        isLoading,

        // Raw settings access for edge cases
        settings
    };
};

export default useFeatureFlags;
