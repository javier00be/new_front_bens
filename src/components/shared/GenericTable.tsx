import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export interface Column<T> {
    header: string;
    key?: keyof T;
    render?: (item: T) => React.ReactNode;
    className?: string;
    headerClassName?: string;
}

interface GenericTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (item: T) => void;
    isLoading?: boolean;
    emptyMessage?: string;
}

export const GenericTable = <T extends Record<string, unknown>>({
    columns,
    data,
    onRowClick,
    isLoading = false,
    emptyMessage = "No hay datos para mostrar.",
}: GenericTableProps<T>) => {
    return (
        <div className="rounded-md border bg-white overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column, index) => (
                            <TableHead
                                key={index}
                                className={`bg-slate-50 font-semibold text-slate-700 ${column.headerClassName ?? ""}`}
                            >
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center text-slate-400">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                    Cargando...
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : !Array.isArray(data) || data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center text-slate-400">
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row, rowIndex) => (
                            <TableRow
                                key={rowIndex}
                                className={onRowClick ? "cursor-pointer hover:bg-slate-50 transition-colors" : "hover:bg-slate-50/50"}
                                onClick={() => onRowClick?.(row)}
                            >
                                {columns.map((column, colIndex) => (
                                    <TableCell key={colIndex} className={column.className}>
                                        {column.render
                                            ? column.render(row)
                                            : (row[column.key as keyof T] as React.ReactNode)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};
