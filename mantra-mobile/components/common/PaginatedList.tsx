/**
 * PaginatedList Component
 * Reusable FlatList wrapper with built-in pagination support
 */

import React, { useCallback } from 'react';
import {
    FlatList,
    View,
    Text,
    ActivityIndicator,
    StyleSheet,
    RefreshControl,
    FlatListProps,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, typography } from '../../constants';

interface PaginatedListProps<T> extends Omit<FlatListProps<T>, 'data' | 'renderItem' | 'onRefresh' | 'refreshing'> {
    /** Array of items to display */
    items: T[];
    /** Render function for each item */
    renderItem: (item: T, index: number) => React.ReactElement;
    /** Key extractor for items */
    keyExtractor: (item: T, index: number) => string;
    /** Whether currently loading */
    loading: boolean;
    /** Whether loading more items */
    loadingMore: boolean;
    /** Whether there are more items to load */
    hasMore: boolean;
    /** Function to load more items */
    onLoadMore: () => void;
    /** Function to refresh list */
    onRefresh: () => void;
    /** Whether list is empty */
    isEmpty?: boolean;
    /** Custom empty state component */
    EmptyComponent?: React.ComponentType;
    /** Custom loading component */
    LoadingComponent?: React.ComponentType;
    /** Message to show when empty */
    emptyMessage?: string;
    /** Icon to show when empty */
    emptyIcon?: React.ReactNode;
    /** Threshold to trigger load more (0-1) */
    loadMoreThreshold?: number;
}

/**
 * Reusable paginated list component
 */
export function PaginatedList<T>({
    items,
    renderItem,
    keyExtractor,
    loading,
    loadingMore,
    hasMore,
    onLoadMore,
    onRefresh,
    isEmpty = false,
    EmptyComponent,
    LoadingComponent,
    emptyMessage = 'No items found',
    emptyIcon,
    loadMoreThreshold = 0.5,
    ...flatListProps
}: PaginatedListProps<T>): React.ReactElement {
    const { theme } = useTheme();

    // Render item wrapper
    const renderItemWrapper = useCallback(
        ({ item, index }: { item: T; index: number }) => renderItem(item, index),
        [renderItem]
    );

    // Footer component (loading more indicator)
    const ListFooterComponent = useCallback(() => {
        if (!loadingMore) return null;

        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                    Loading more...
                </Text>
            </View>
        );
    }, [loadingMore, theme]);

    // Empty component
    const ListEmptyComponent = useCallback(() => {
        if (loading) {
            if (LoadingComponent) return <LoadingComponent />;
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                        Loading...
                    </Text>
                </View>
            );
        }

        if (isEmpty) {
            if (EmptyComponent) return <EmptyComponent />;
            return (
                <View style={styles.centerContainer}>
                    {emptyIcon}
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        {emptyMessage}
                    </Text>
                </View>
            );
        }

        return null;
    }, [loading, isEmpty, LoadingComponent, EmptyComponent, emptyMessage, emptyIcon, theme]);

    // Handle end reached
    const handleEndReached = useCallback(() => {
        if (hasMore && !loading && !loadingMore) {
            onLoadMore();
        }
    }, [hasMore, loading, loadingMore, onLoadMore]);

    return (
        <FlatList
            data={items}
            renderItem={renderItemWrapper}
            keyExtractor={keyExtractor}
            onEndReached={handleEndReached}
            onEndReachedThreshold={loadMoreThreshold}
            ListFooterComponent={ListFooterComponent}
            ListEmptyComponent={ListEmptyComponent}
            refreshControl={
                <RefreshControl
                    refreshing={loading && items.length > 0}
                    onRefresh={onRefresh}
                    tintColor={theme.primary}
                    colors={[theme.primary]}
                />
            }
            showsVerticalScrollIndicator={false}
            {...flatListProps}
        />
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing[12],
    },
    footerLoader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing[4],
        gap: spacing[2],
    },
    loadingText: {
        fontSize: typography.fontSize.sm,
        marginTop: spacing[2],
    },
    emptyText: {
        fontSize: typography.fontSize.base,
        textAlign: 'center',
        marginTop: spacing[3],
    },
});

export default PaginatedList;
