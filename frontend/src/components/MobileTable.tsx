import React from 'react';

interface Column {
  key: string;
  title: string;
  render?: (value: any, record: any) => React.ReactNode;
  mobileLabel?: string;
  mobileRender?: (value: any, record: any) => React.ReactNode;
  className?: string;
  mobileClassName?: string;
}

interface MobileTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (record: any, index: number) => void;
  className?: string;
}

const MobileTable: React.FC<MobileTableProps> = ({
  columns,
  data,
  loading = false,
  emptyMessage = "No hay datos disponibles",
  onRowClick,
  className = ""
}) => {
  if (loading) {
    return (
      <div className="animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                  >
                    {column.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((record, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick?.(record, index)}
                  className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${column.className || ''}`}
                    >
                      {column.render ? column.render(record[column.key], record) : record[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((record, index) => (
          <div
            key={index}
            onClick={() => onRowClick?.(record, index)}
            className={`bg-white rounded-lg shadow border border-gray-200 p-4 ${
              onRowClick ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100" : ""
            }`}
          >
            <div className="space-y-2">
              {columns.map((column) => {
                const value = record[column.key];
                if (value === null || value === undefined || value === '') return null;

                return (
                  <div key={column.key} className="flex justify-between items-start">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mr-2">
                      {column.mobileLabel || column.title}:
                    </span>
                    <span className={`text-sm text-gray-900 text-right flex-1 ${column.mobileClassName || ''}`}>
                      {column.mobileRender 
                        ? column.mobileRender(value, record)
                        : column.render 
                          ? column.render(value, record) 
                          : value
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileTable;