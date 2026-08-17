import React from 'react'

export interface Column {
  key: string
  label: string
  render?: (value: any, row: any) => React.ReactNode
}

export interface DataTableProps {
  columns: Column[]
  data: Record<string, any>[]
  actions?: (row: any) => React.ReactNode
}

export default function DataTable({ columns, data, actions }: DataTableProps) {
  return (
    <div style={{
      backgroundColor: '#0a0f1a',
      border: '1px solid #1f2937',
      borderRadius: '8px',
      overflow: 'hidden',
      width: '100%'
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left'
        }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={{
                  backgroundColor: '#111827',
                  padding: '12px 24px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid #1f2937'
                }}>
                  {col.label}
                </th>
              ))}
              {actions && (
                <th style={{
                  backgroundColor: '#111827',
                  padding: '12px 24px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid #1f2937',
                  width: '100px'
                }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} style={{
                  padding: '32px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '0.875rem'
                }}>
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id || i} style={{
                  borderBottom: i === data.length - 1 ? 'none' : '1px solid #1f2937',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#111827'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem',
                      color: '#d1d5db'
                    }}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  {actions && (
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '0.875rem'
                    }}>
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
