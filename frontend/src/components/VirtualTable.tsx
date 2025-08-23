import React, { useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import VirtualList from './VirtualList';

export interface VirtualTableColumn<T> {
  key: keyof T | string;
  title: string;
  width?: number | string;
  minWidth?: number;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
}

export interface VirtualTableProps<T> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  height: number;
  rowHeight?: number;
  headerHeight?: number;
  overscan?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (record: T, index: number) => void;
  selectedRows?: number[];
  onRowSelect?: (selectedIndices: number[]) => void;
  loading?: boolean;
  empty?: React.ReactNode;
  className?: string;
  rowClassName?: (record: T, index: number) => string;
  getRowKey?: (record: T, index: number) => string | number;
}

const VirtualTable = <T extends Record<string, any>>({
  data,
  columns,
  height,
  rowHeight = 50,
  headerHeight = 40,
  overscan = 5,
  sortBy,
  sortDirection = 'asc',
  onSort,
  onRowClick,
  selectedRows = [],
  onRowSelect,
  loading = false,
  empty,
  className = '',
  rowClassName,
  getRowKey = (_, index) => index
}: VirtualTableProps<T>) => {
  
  // Calculate content height (excluding header)
  const contentHeight = height - headerHeight;

  // Handle column sorting
  const handleSort = useCallback((columnKey: string) => {
    if (!onSort) return;
    
    const newDirection = sortBy === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnKey, newDirection);
  }, [sortBy, sortDirection, onSort]);

  // Handle row selection
  const handleRowSelect = useCallback((index: number, isSelected: boolean) => {
    if (!onRowSelect) return;

    const newSelection = isSelected
      ? selectedRows.filter(i => i !== index)
      : [...selectedRows, index];
    
    onRowSelect(newSelection);
  }, [selectedRows, onRowSelect]);

  // Handle select all
  const handleSelectAll = useCallback((isSelectingAll: boolean) => {
    if (!onRowSelect) return;

    const newSelection = isSelectingAll
      ? []
      : data.map((_, index) => index);
    
    onRowSelect(newSelection);
  }, [data, onRowSelect]);

  // Render table header
  const renderHeader = () => {
    const isAllSelected = selectedRows.length === data.length && data.length > 0;
    const isPartiallySelected = selectedRows.length > 0 && selectedRows.length < data.length;

    return (
      <div 
        className="virtual-table-header bg-gray-50 border-b border-gray-200 flex items-center"
        style={{ height: headerHeight }}
      >
        {/* Selection column */}
        {onRowSelect && (
          <div className="px-4 flex items-center justify-center" style={{ width: 50 }}>
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={input => {
                if (input) input.indeterminate = isPartiallySelected;
              }}
              onChange={() => handleSelectAll(!isAllSelected)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Data columns */}
        {columns.map((column, index) => {
          const width = typeof column.width === 'number' ? `${column.width}px` : column.width;
          const isSorted = sortBy === column.key;
          const canSort = column.sortable && onSort;

          return (
            <div
              key={index}
              className={`px-4 flex items-center ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : 'justify-start'} ${
                canSort ? 'cursor-pointer hover:bg-gray-100' : ''
              } ${column.headerClassName || ''}`}
              style={{ 
                width, 
                minWidth: column.minWidth || 100,
                flex: width ? 'none' : 1
              }}
              onClick={() => canSort && handleSort(column.key as string)}
            >
              <span className="text-sm font-semibold text-gray-900 truncate">
                {column.title}
              </span>
              {canSort && (
                <span className="ml-2 flex-shrink-0">
                  {isSorted ? (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3 w-3 text-gray-400" />
                  )}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render table row
  const renderRow = (record: T, index: number, isVisible: boolean) => {
    const isSelected = selectedRows.includes(index);
    const rowKey = getRowKey(record, index);
    const baseRowClass = `virtual-table-row border-b border-gray-100 flex items-center hover:bg-gray-50 ${
      isSelected ? 'bg-blue-50' : 'bg-white'
    } ${onRowClick ? 'cursor-pointer' : ''}`;
    
    const customRowClass = rowClassName ? rowClassName(record, index) : '';
    const finalRowClass = `${baseRowClass} ${customRowClass}`;

    return (
      <div
        key={rowKey}
        className={finalRowClass}
        style={{ height: rowHeight }}
        onClick={() => onRowClick?.(record, index)}
      >
        {/* Selection column */}
        {onRowSelect && (
          <div className="px-4 flex items-center justify-center" style={{ width: 50 }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleRowSelect(index, isSelected)}
              onClick={(e) => e.stopPropagation()}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Data columns */}
        {columns.map((column, colIndex) => {
          const width = typeof column.width === 'number' ? `${column.width}px` : column.width;
          const value = record[column.key as keyof T];
          const cellContent = column.render ? column.render(value, record, index) : value;

          return (
            <div
              key={colIndex}
              className={`px-4 flex items-center ${
                column.align === 'center' ? 'justify-center' : 
                column.align === 'right' ? 'justify-end' : 'justify-start'
              } ${column.className || ''}`}
              style={{ 
                width, 
                minWidth: column.minWidth || 100,
                flex: width ? 'none' : 1
              }}
              title={typeof cellContent === 'string' ? cellContent : undefined}
            >
              {isVisible ? (
                <div className="truncate text-sm text-gray-900">
                  {cellContent}
                </div>
              ) : (
                <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Empty state
  if (data.length === 0 && !loading) {
    return (
      <div className={`virtual-table ${className}`}>
        {renderHeader()}
        <div 
          className="flex items-center justify-center text-gray-500"
          style={{ height: contentHeight }}
        >
          {empty || (
            <div className="text-center">
              <p className="text-sm">No hay datos disponibles</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`virtual-table ${className}`}>
        {renderHeader()}
        <div 
          className="flex items-center justify-center"
          style={{ height: contentHeight }}
        >
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            <span className="text-sm text-gray-600">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`virtual-table border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {renderHeader()}
      
      <VirtualList
        items={data}
        itemHeight={rowHeight}
        containerHeight={contentHeight}
        renderItem={renderRow}
        overscan={overscan}
        getItemKey={getRowKey}
        className="virtual-table-body"
      />

      {/* Selection info */}
      {onRowSelect && selectedRows.length > 0 && (
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedRows.length} elemento{selectedRows.length !== 1 ? 's' : ''} seleccionado{selectedRows.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => handleSelectAll(true)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Deseleccionar todo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualTable;