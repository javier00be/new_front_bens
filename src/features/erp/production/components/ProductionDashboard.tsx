import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GenericModal, ConfirmModal } from "@/components/shared/GenericModal";
import {
    Factory, Package, CheckCircle2, Clock, XCircle,
    PlayCircle, Calendar, Layers, BanIcon,
} from "lucide-react";
import { useProduction } from "../hooks/useProduction";
import type { OrdenProduccion, EstadoProduccion, CreateOrdenProduccionDto } from "../types/production.type";
import { AddProductionOrderForm } from "./AddProductionOrderForm";
import { sileo } from "sileo";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoProduccion, { label: string; badge: string; icon: React.ElementType }> = {
    PENDIENTE:  { label: "Pendiente",  badge: "bg-amber-50 text-amber-700 border border-amber-200",   icon: Clock        },
    EN_PROCESO: { label: "En proceso", badge: "bg-blue-50 text-blue-700 border border-blue-200",      icon: PlayCircle   },
    COMPLETADO: { label: "Completado", badge: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: CheckCircle2 },
    CANCELADO:  { label: "Cancelado",  badge: "bg-rose-50 text-rose-600 border border-rose-200",      icon: XCircle      },
};

const SkeletonRow = () => (
    <tr className="border-b border-slate-100">
        {[40, 100, 80, 90, 100, 80, 60].map((w, i) => (
            <td key={i} className="px-5 py-4">
                <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: w }} />
            </td>
        ))}
    </tr>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const ProductionDashboard = () => {
    const { ordenes, isLoading, addOrden, iniciarOrden, completarOrden, cancelarOrden } = useProduction();
    const [isCreateOpen,     setIsCreateOpen]     = useState(false);
    const [completingOrden,  setCompletingOrden]  = useState<OrdenProduccion | null>(null);
    const [cantidadProducida, setCantidadProducida] = useState("");
    const [cancelingId,      setCancelingId]      = useState<number | null>(null);
    const [actionLoading,    setActionLoading]    = useState(false);

    const handleCreate = async (dto: CreateOrdenProduccionDto) => {
        const result = await addOrden(dto);
        if (result) {
            sileo.success({ title: "Orden creada", description: `Orden #${result.id} registrada con estado Pendiente.` });
            setIsCreateOpen(false);
        } else {
            sileo.error({ title: "Error", description: "No se pudo crear la orden de producción." });
        }
    };

    const handleIniciar = async (orden: OrdenProduccion) => {
        setActionLoading(true);
        const ok = await iniciarOrden(orden.id);
        setActionLoading(false);
        if (ok) sileo.success({ title: "Iniciada", description: `Orden #${orden.id} ahora está en proceso.` });
        else sileo.error({ title: "Error", description: "No se pudo iniciar la orden." });
    };

    const handleCompletar = async () => {
        if (!completingOrden) return;
        const qty = parseInt(cantidadProducida, 10);
        if (!qty || qty <= 0) {
            sileo.error({ title: "Error", description: "Ingresa una cantidad válida." });
            return;
        }
        setActionLoading(true);
        const ok = await completarOrden(completingOrden.id, qty);
        setActionLoading(false);
        if (ok) {
            sileo.success({ title: "Completada", description: `Orden #${completingOrden.id} completada. Stock e inventario actualizados.` });
            setCompletingOrden(null);
            setCantidadProducida("");
        } else {
            sileo.error({ title: "Error", description: "No se pudo completar. Verifica que haya suficientes materiales en stock." });
        }
    };

    const handleCancelar = async () => {
        if (!cancelingId) return;
        setActionLoading(true);
        const ok = await cancelarOrden(cancelingId);
        setActionLoading(false);
        if (ok) {
            sileo.success({ title: "Cancelada", description: `Orden #${cancelingId} fue cancelada.` });
            setCancelingId(null);
        } else {
            sileo.error({ title: "Error", description: "No se pudo cancelar la orden." });
        }
    };

    // Stats
    const pendientes  = ordenes.filter(o => o.estado === "PENDIENTE").length;
    const enProceso   = ordenes.filter(o => o.estado === "EN_PROCESO").length;
    const completadas = ordenes.filter(o => o.estado === "COMPLETADO").length;
    const canceladas  = ordenes.filter(o => o.estado === "CANCELADO").length;

    return (
        <div className="space-y-6 pb-8">

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-green-900 via-green-800 to-emerald-900 px-8 py-7 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(74,222,128,0.2),transparent_60%)]" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <p className="text-green-300 text-xs font-semibold uppercase tracking-widest mb-1">Módulo ERP</p>
                        <h1 className="text-2xl font-bold text-white">Producción</h1>
                        <p className="text-green-200/70 text-sm mt-1">Gestiona la fabricación de productos textiles desde materia prima.</p>
                    </div>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-lg backdrop-blur-sm"
                    >
                        <Factory className="w-4 h-4 mr-2" /> Nueva Orden
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Pendientes",  value: pendientes,  color: "amber",   bg: "bg-amber-50",   icon: <Clock className="w-4 h-4 text-amber-700" /> },
                    { label: "En proceso",  value: enProceso,   color: "blue",    bg: "bg-blue-50",    icon: <PlayCircle className="w-4 h-4 text-blue-700" /> },
                    { label: "Completadas", value: completadas, color: "emerald", bg: "bg-emerald-50", icon: <CheckCircle2 className="w-4 h-4 text-emerald-700" /> },
                    { label: "Canceladas",  value: canceladas,  color: "rose",    bg: "bg-rose-50",    icon: <XCircle className="w-4 h-4 text-rose-600" /> },
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
                            <CardTitle className="text-lg">Órdenes de Producción</CardTitle>
                            <CardDescription>Historial de órdenes con su estado actual y acciones disponibles.</CardDescription>
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
                            {ordenes.length} registros
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80">
                                    {["#", "Producto", "Variante", "Cantidad", "Estado", "Fecha", "Acciones"].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
                        </table>
                    ) : ordenes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                                <Factory className="w-8 h-8 text-green-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500 mb-4">Sin órdenes de producción</p>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setIsCreateOpen(true)}>
                                <Factory className="w-3.5 h-3.5 mr-1.5" /> Crear primera orden
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/80">
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">#</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Producto</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Variante</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cantidad</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {ordenes.map(o => {
                                        const cfg = ESTADO_CONFIG[o.estado];
                                        const Icon = cfg.icon;
                                        const isTerminado = o.estado === "COMPLETADO" || o.estado === "CANCELADO";
                                        return (
                                            <tr
                                                key={o.id}
                                                className={`transition-colors ${isTerminado ? "opacity-60 bg-slate-50/40" : "hover:bg-slate-50/80"}`}
                                            >
                                                <td className="px-5 py-4">
                                                    <span className="font-mono font-bold text-slate-700 text-sm">#{o.id}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Layers className="w-4 h-4 text-slate-400 shrink-0" />
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {o.producto?.nombre ?? `Producto #${o.productoId}`}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {o.talla && (
                                                            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                                                                {o.talla.nombre}
                                                            </span>
                                                        )}
                                                        {o.color && (
                                                            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                                                                {o.color.nombre}
                                                            </span>
                                                        )}
                                                        {!o.talla && !o.color && (
                                                            <span className="text-xs text-slate-400">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Package className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-sm font-semibold text-slate-700">{o.cantidadProducida}</span>
                                                        <span className="text-xs text-slate-400">/ {o.cantidadPlanificada}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${cfg.badge}`}>
                                                        <Icon className="w-3 h-3" /> {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {o.fechaInicio
                                                            ? new Date(o.fechaInicio).toLocaleDateString("es-PE")
                                                            : new Date(o.createdAt).toLocaleDateString("es-PE")}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1">
                                                        {o.estado === "PENDIENTE" && (
                                                            <button
                                                                onClick={() => handleIniciar(o)}
                                                                disabled={actionLoading}
                                                                className="h-7 px-2.5 text-[11px] font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors disabled:opacity-50"
                                                            >
                                                                Iniciar
                                                            </button>
                                                        )}
                                                        {o.estado === "EN_PROCESO" && (
                                                            <button
                                                                onClick={() => { setCompletingOrden(o); setCantidadProducida(String(o.cantidadPlanificada)); }}
                                                                className="h-7 px-2.5 text-[11px] font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                                                            >
                                                                Completar
                                                            </button>
                                                        )}
                                                        {(o.estado === "PENDIENTE" || o.estado === "EN_PROCESO") && (
                                                            <button
                                                                onClick={() => setCancelingId(o.id)}
                                                                className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-colors"
                                                                title="Cancelar orden"
                                                            >
                                                                <BanIcon className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        {isTerminado && (
                                                            <span className="text-xs text-slate-300">—</span>
                                                        )}
                                                    </div>
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

            {/* Modal nueva orden */}
            <GenericModal
                title="Nueva Orden de Producción"
                description="Crea una orden para fabricar un producto textil."
                isOpen={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                size="lg"
                scrollable
            >
                <AddProductionOrderForm
                    onSuccess={handleCreate}
                    onCancel={() => setIsCreateOpen(false)}
                />
            </GenericModal>

            {/* Modal completar orden */}
            <GenericModal
                title={`Completar Orden #${completingOrden?.id}`}
                description="Indica la cantidad real producida para actualizar el inventario."
                isOpen={!!completingOrden}
                onOpenChange={(open) => { if (!open) setCompletingOrden(null); }}
                size="sm"
            >
                <div className="space-y-4 text-sm">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                            Cantidad producida <span className="text-slate-400">(planificada: {completingOrden?.cantidadPlanificada})</span>
                        </label>
                        <Input
                            type="number"
                            min={1}
                            value={cantidadProducida}
                            onChange={e => setCantidadProducida(e.target.value)}
                            placeholder="Ej: 100"
                        />
                    </div>
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                        Al completar, se descontarán los materiales de la receta y se sumará el stock al inventario del producto.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => setCompletingOrden(null)} disabled={actionLoading}>
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleCompletar}
                            disabled={actionLoading}
                        >
                            {actionLoading ? "Procesando..." : "Completar Orden"}
                        </Button>
                    </div>
                </div>
            </GenericModal>

            {/* Confirm cancelar */}
            <ConfirmModal
                isOpen={!!cancelingId}
                onOpenChange={open => { if (!open) setCancelingId(null); }}
                title="Cancelar orden"
                confirmLabel="Sí, cancelar"
                variant="danger"
                isLoading={actionLoading}
                onConfirm={handleCancelar}
                description={
                    <>
                        ¿Cancelar la orden <strong className="text-slate-800">#{cancelingId}</strong>?
                        <span className="block mt-1 text-slate-500">
                            Esta acción no revierte materiales ya consumidos. La orden quedará como cancelada.
                        </span>
                    </>
                }
            />
        </div>
    );
};

export default ProductionDashboard;
