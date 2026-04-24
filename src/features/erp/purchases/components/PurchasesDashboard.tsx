import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GenericModal, ConfirmModal } from "@/components/shared/GenericModal";
import {
    ShoppingCart, Truck, Calendar, BanIcon,
    Package, Layers, Box, CheckCircle2, XCircle,
} from "lucide-react";
import { usePurchases } from "../hooks/usePurchases";
import type { Purchase, CreatePurchaseDto } from "../types/purchases.type";
import { AddPurchaseForm } from "./AddPurchaseForm";
import { sileo } from "sileo";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getPurchaseTotal = (p: Purchase): number => {
    if (p.total != null) return Number(p.total);
    const t1 = (p.detalles ?? []).reduce((s, d) => s + d.cantidad * d.precio, 0);
    const t2 = (p.detallesArticulo ?? []).reduce((s, d) => s + d.cantidad * d.precio, 0);
    return t1 + t2;
};

const getPurchaseItems = (p: Purchase): string => {
    if (p.tipo === "ARTICULO") {
        return (p.detallesArticulo ?? [])
            .map(d => `${d.articulo?.nombre ?? "—"} ×${d.cantidad}`)
            .join(", ") || "—";
    }
    return (p.detalles ?? [])
        .map(d => {
            const parts = [d.producto?.nombre ?? "—"];
            if (d.talla) parts.push(d.talla.nombre);
            parts.push(`×${d.cantidad}`);
            return parts.join(" ");
        })
        .join(", ") || "—";
};

const SkeletonRow = () => (
    <tr className="border-b border-slate-100">
        {[40, 80, 90, 120, 200, 80, 90, 40].map((w, i) => (
            <td key={i} className="px-5 py-4">
                <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: w }} />
            </td>
        ))}
    </tr>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const PurchasesDashboard = () => {
    const { purchases, isLoading, addPurchase, cancelPurchase } = usePurchases();
    const [isModalOpen,    setIsModalOpen]    = useState(false);
    const [confirmAnular,  setConfirmAnular]  = useState<Purchase | null>(null);
    const [isAnulando,     setIsAnulando]     = useState(false);

    const handleCreate = async (dto: CreatePurchaseDto) => {
        const result = await addPurchase(dto);
        if (result) {
            sileo.success({ title: "Compra registrada", description: `Compra #${result.id} guardada correctamente.` });
            setIsModalOpen(false);
        } else {
            sileo.error({ title: "Error", description: "No se pudo registrar la compra." });
        }
    };

    const handleAnular = async () => {
        if (!confirmAnular) return;
        setIsAnulando(true);
        const result = await cancelPurchase(confirmAnular.id);
        if (result) {
            sileo.success({ title: "Compra anulada", description: `Compra #${confirmAnular.id} anulada. El stock fue revertido.` });
        } else {
            sileo.error({ title: "Error", description: "No se pudo anular la compra." });
        }
        setIsAnulando(false);
        setConfirmAnular(null);
    };

    // Stats — excluir anuladas del gasto real
    const vigentes        = purchases.filter(p => p.estado === "VIGENTE");
    const anuladas        = purchases.filter(p => p.estado === "ANULADO");
    const totalGastado    = vigentes.reduce((s, p) => s + getPurchaseTotal(p), 0);
    const comprasArticulo = vigentes.filter(p => p.tipo === "ARTICULO").length;
    const comprasProducto = vigentes.filter(p => p.tipo === "PRODUCTO").length;

    return (
        <div className="space-y-6 pb-8">

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-amber-900 via-amber-800 to-orange-900 px-8 py-7 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.2),transparent_60%)]" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <p className="text-amber-300 text-xs font-semibold uppercase tracking-widest mb-1">Módulo ERP</p>
                        <h1 className="text-2xl font-bold text-white">Compras</h1>
                        <p className="text-amber-200/70 text-sm mt-1">Registra órdenes de compra de insumos y productos terminados.</p>
                    </div>
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-lg backdrop-blur-sm"
                    >
                        <ShoppingCart className="w-4 h-4 mr-2" /> Nueva Compra
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Gasto total",   value: `S/ ${totalGastado.toFixed(2)}`, color: "amber",  bg: "bg-amber-50",  icon: <Layers className="w-4 h-4 text-amber-700" /> },
                    { label: "De insumos",    value: comprasArticulo,                  color: "teal",   bg: "bg-teal-50",   icon: <Box className="w-4 h-4 text-teal-700" /> },
                    { label: "De productos",  value: comprasProducto,                  color: "indigo", bg: "bg-indigo-50", icon: <Package className="w-4 h-4 text-indigo-700" /> },
                    { label: "Anuladas",      value: anuladas.length,                  color: "rose",   bg: "bg-rose-50",   icon: <BanIcon className="w-4 h-4 text-rose-600" /> },
                ].map(({ label, value, color, bg, icon }) => (
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
                            <CardTitle className="text-lg">Historial de Compras</CardTitle>
                            <CardDescription>Todas las órdenes de compra registradas en el sistema.</CardDescription>
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
                            {purchases.length} registros
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80">
                                    {["#", "Estado", "Tipo", "Proveedor", "Detalle", "Total", "Fecha", ""].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
                        </table>
                    ) : purchases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                                <ShoppingCart className="w-8 h-8 text-amber-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500 mb-4">Sin compras registradas</p>
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setIsModalOpen(true)}>
                                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Registrar primera compra
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/80">
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">#</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tipo</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Proveedor</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detalle</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                                        <th className="px-3 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {purchases.map(p => {
                                        const isAnulado = p.estado === "ANULADO";
                                        return (
                                            <tr
                                                key={p.id}
                                                className={`transition-colors ${isAnulado ? "bg-slate-50/60 opacity-70" : "hover:bg-slate-50/80"}`}
                                            >
                                                <td className="px-5 py-4">
                                                    <span className="font-mono font-bold text-slate-700 text-sm">#{p.id}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {isAnulado ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                                                            <XCircle className="w-3 h-3" /> Anulado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <CheckCircle2 className="w-3 h-3" /> Vigente
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {p.tipo === "ARTICULO" ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-teal-100 text-teal-700 border border-teal-200 uppercase">
                                                            <Box className="w-3 h-3" /> Insumo
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase">
                                                            <Package className="w-3 h-3" /> Producto
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-slate-700">{p.proveedor?.nombre ?? `Proveedor #${p.proveedorId}`}</span>
                                                            {p.proveedor?.documento && (
                                                                <span className="text-[11px] text-slate-400">{p.proveedor.documento}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 max-w-xs">
                                                    <p className="text-xs text-slate-500 truncate">{getPurchaseItems(p)}</p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`font-bold text-sm ${isAnulado ? "line-through text-slate-400" : "text-slate-800"}`}>
                                                        S/ {getPurchaseTotal(p).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {new Date(p.createdAt).toLocaleDateString("es-PE")}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4">
                                                    {!isAnulado && (
                                                        <button
                                                            onClick={() => setConfirmAnular(p)}
                                                            className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-colors"
                                                            title="Anular compra"
                                                        >
                                                            <BanIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal nueva compra */}
            <GenericModal
                title="Nueva Compra"
                description="Registra una orden de compra a un proveedor."
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                size="lg"
                scrollable
            >
                <AddPurchaseForm
                    onSuccess={handleCreate}
                    onCancel={() => setIsModalOpen(false)}
                />
            </GenericModal>

            {/* Confirm anular */}
            <ConfirmModal
                isOpen={!!confirmAnular}
                onOpenChange={open => { if (!open) setConfirmAnular(null); }}
                title="Anular compra"
                confirmLabel="Anular"
                variant="danger"
                isLoading={isAnulando}
                onConfirm={handleAnular}
                description={
                    <>
                        ¿Anular la compra <strong className="text-slate-800">#{confirmAnular?.id}</strong>?
                        <span className="block mt-1 text-slate-500">
                            El stock ingresado será revertido. La compra quedará registrada como anulada.
                        </span>
                    </>
                }
            />
        </div>
    );
};

export default PurchasesDashboard;
