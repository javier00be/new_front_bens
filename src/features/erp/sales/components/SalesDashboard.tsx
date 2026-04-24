import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GenericModal } from "@/components/shared/GenericModal";
import {
    TrendingUp, ShoppingBag, Eye, ChevronLeft, ChevronRight,
    CreditCard, Calendar, DollarSign,
} from "lucide-react";
import { useSales } from "../hooks/useSales";
import type { Sale } from "../types/sales.type";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const SkeletonRow = () => (
    <tr className="border-b border-slate-100">
        {[40, 60, 120, 100, 90, 80, 40].map((w, i) => (
            <td key={i} className="px-5 py-4">
                <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: w }} />
            </td>
        ))}
    </tr>
);

// ─── Modal detalle ─────────────────────────────────────────────────────────────

const SaleDetailModal = ({ sale, onClose }: { sale: Sale; onClose: () => void }) => (
    <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-slate-50 rounded-xl p-4">
            <div>
                <span className="text-slate-500 text-xs">Pedido</span>
                <p className="font-mono font-bold text-slate-800">#{sale.pedidoId}</p>
            </div>
            <div>
                <span className="text-slate-500 text-xs">Fecha</span>
                <p className="font-medium text-slate-800">{new Date(sale.createdAt).toLocaleDateString("es-PE")}</p>
            </div>
            <div>
                <span className="text-slate-500 text-xs">Cliente</span>
                <p className="font-medium text-slate-800">
                    {sale.pedido?.cliente ? `${sale.pedido.cliente.nombre} ${sale.pedido.cliente.apellido}` : "—"}
                </p>
            </div>
            <div>
                <span className="text-slate-500 text-xs">Medio de pago</span>
                <p className="font-medium text-slate-800">{sale.pedido?.medioPago?.nombre ?? "—"}</p>
            </div>
        </div>

        <table className="w-full text-xs">
            <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                    <th className="text-left py-2 font-medium">Producto</th>
                    <th className="text-center py-2 font-medium">Talla / Color</th>
                    <th className="text-right py-2 font-medium">Qty</th>
                    <th className="text-right py-2 font-medium">P. Unit.</th>
                    <th className="text-right py-2 font-medium">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                {sale.pedido?.detalles?.map((d, i) => (
                    <tr key={i} className="border-b border-slate-50">
                        <td className="py-2 font-medium text-slate-700">{d.producto?.nombre ?? `Producto #${d.productoId}`}</td>
                        <td className="py-2 text-center text-slate-500">
                            {[d.talla?.nombre, d.color?.nombre].filter(Boolean).join(" / ") || "—"}
                        </td>
                        <td className="py-2 text-right">{d.cantidad}</td>
                        <td className="py-2 text-right">S/ {Number(d.precioUnitario).toFixed(2)}</td>
                        <td className="py-2 text-right font-semibold">S/ {Number(d.subtotal).toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-base font-bold text-slate-900">
                Total: S/ {Number(sale.pedido?.total ?? 0).toFixed(2)}
            </span>
            <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
        </div>
    </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const SalesDashboard = () => {
    const { sales, isLoading } = useSales();
    const [detailSale,  setDetailSale]  = useState<Sale | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // Stats
    const hoy = new Date().toDateString();
    const ventasHoy     = sales.filter(s => new Date(s.createdAt).toDateString() === hoy);
    const totalHoy      = ventasHoy.reduce((sum, s) => sum + Number(s.pedido?.total ?? 0), 0);
    const totalGeneral  = sales.reduce((sum, s) => sum + Number(s.pedido?.total ?? 0), 0);

    // Paginación
    const totalPages    = Math.ceil(sales.length / ITEMS_PER_PAGE);
    const paginatedSales = sales.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="space-y-6 pb-8">

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-900 via-emerald-800 to-teal-900 px-8 py-7 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(52,211,153,0.2),transparent_60%)]" />
                <div className="relative">
                    <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-1">Módulo ERP</p>
                    <h1 className="text-2xl font-bold text-white">Ventas</h1>
                    <p className="text-emerald-200/70 text-sm mt-1">
                        Registro de ventas confirmadas. Se generan automáticamente al pagar un pedido.
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Ventas de hoy",  value: `S/ ${totalHoy.toFixed(2)}`,     color: "emerald", bg: "bg-emerald-50", icon: <TrendingUp className="w-4 h-4 text-emerald-700" />, sub: `${ventasHoy.length} transacciones` },
                    { label: "Total acumulado", value: `S/ ${totalGeneral.toFixed(2)}`, color: "teal",    bg: "bg-teal-50",    icon: <DollarSign className="w-4 h-4 text-teal-700" />,    sub: "Histórico general" },
                    { label: "Transacciones",   value: sales.length,                    color: "indigo",  bg: "bg-indigo-50",  icon: <ShoppingBag className="w-4 h-4 text-indigo-700" />, sub: "Ventas registradas" },
                ].map(({ label, value, color, bg, icon, sub }) => (
                    <Card key={label} className="border-0 shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="flex items-stretch">
                                <div className={`w-1.5 bg-${color}-500 rounded-l-xl shrink-0`} />
                                <div className="flex-1 px-5 py-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
                                        <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
                                    </div>
                                    <p className={`text-2xl font-bold text-${color}-700 tabular-nums`}>{value}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabla */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-slate-100 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Historial de Ventas</CardTitle>
                            <CardDescription>Las ventas se generan automáticamente al confirmar el pago de un pedido.</CardDescription>
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
                            {sales.length} registros
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80">
                                    {["Venta #", "Pedido", "Cliente", "Medio de pago", "Total", "Fecha", ""].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
                        </table>
                    ) : sales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                                <ShoppingBag className="w-8 h-8 text-emerald-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500 mb-1">Sin ventas registradas</p>
                            <p className="text-xs text-slate-400">Las ventas aparecen aquí cuando confirmas el pago de un pedido.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/80">
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Venta #</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pedido</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Medio de pago</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                                        <th className="px-3 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paginatedSales.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-5 py-4">
                                                <span className="font-mono font-bold text-slate-700 text-sm">#{s.id}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs text-slate-500 font-mono">#{s.pedidoId}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-sm font-medium text-slate-700">
                                                    {s.pedido?.cliente
                                                        ? `${s.pedido.cliente.nombre} ${s.pedido.cliente.apellido}`
                                                        : "—"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                                    {s.pedido?.medioPago?.nombre ?? "—"}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="font-bold text-sm text-emerald-700">
                                                    S/ {Number(s.pedido?.total ?? 0).toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(s.createdAt).toLocaleDateString("es-PE")}
                                                </div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <button
                                                    onClick={() => setDetailSale(s)}
                                                    className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 flex items-center justify-center transition-colors"
                                                    title="Ver detalle"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Paginación */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-3 border-t border-slate-100">
                                    <span className="text-xs text-slate-500">
                                        Página {currentPage} de {totalPages}
                                    </span>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal: Detalle venta */}
            <GenericModal
                title={`Detalle Venta #${detailSale?.id}`}
                isOpen={!!detailSale}
                onOpenChange={open => { if (!open) setDetailSale(null); }}
                size="md"
                scrollable
            >
                {detailSale && <SaleDetailModal sale={detailSale} onClose={() => setDetailSale(null)} />}
            </GenericModal>
        </div>
    );
};

export default SalesDashboard;
