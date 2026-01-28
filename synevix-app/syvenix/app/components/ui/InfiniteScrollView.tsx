import React, { useCallback } from 'react';
import {
  FlatList,
  FlatListProps,
  RefreshControl,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { COLORS } from '@/constants/Colors';

interface InfiniteScrollViewProps<T> extends Omit<FlatListProps<T>, 'onEndReached' | 'ListFooterComponent'> {
  data: T[];
  renderItem: FlatListProps<T>['renderItem'];
  keyExtractor: (item: T, index: number) => string;
  onLoadMore: () => void;
  onRefresh?: () => void;
  hasMoreData?: boolean;
  isLoading?: boolean;
  isRefreshing?: boolean;
  loadingText?: string;
  emptyText?: string;
  emptyComponent?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  showRefreshControl?: boolean;
  threshold?: number;
}

const InfiniteScrollView = <T,>({
  data,
  renderItem,
  keyExtractor,
  onLoadMore,
  onRefresh,
  hasMoreData = true,
  isLoading = false,
  isRefreshing = false,
  loadingText = 'Loading more...',
  emptyText = 'No items found',
  emptyComponent,
  loadingComponent,
  showRefreshControl = true,
  threshold = 0.5,
  ...props
}: InfiniteScrollViewProps<T>) => {
  const handleEndReached = useCallback(() => {
    if (!isLoading && hasMoreData) {
      onLoadMore();
    }
  }, [isLoading, hasMoreData, onLoadMore]);

  const renderFooter = useCallback(() => {
    if (!isLoading || !hasMoreData) return null;
    
    return loadingComponent || (
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.footerText}>{loadingText}</Text>
      </View>
    );
  }, [isLoading, hasMoreData, loadingComponent, loadingText]);

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    
    return emptyComponent || (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }, [isLoading, emptyComponent, emptyText]);

  const refreshControl = showRefreshControl && onRefresh ? (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      colors={[COLORS.primary]}
      tintColor={COLORS.primary}
    />
  ) : undefined;

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={handleEndReached}
      onEndReachedThreshold={threshold}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default InfiniteScrollView;