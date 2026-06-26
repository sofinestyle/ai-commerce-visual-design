export type AppTableColumn = {
  key: string;
  title: string;
};

export type AppTableRow = Record<string, string | number>;

type AppTableProps = {
  columns: AppTableColumn[];
  rows: AppTableRow[];
};

export function AppTable({ columns, rows }: AppTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-blue-100 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-blue-100 text-slate-500">
            {columns.map((column) => (
              <th className="px-5 py-3 font-medium" key={column.key}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-blue-50">
          {rows.map((row, rowIndex) => (
            <tr key={row.id ?? rowIndex}>
              {columns.map((column) => (
                <td className="px-5 py-4 text-slate-600" key={column.key}>
                  {row[column.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
