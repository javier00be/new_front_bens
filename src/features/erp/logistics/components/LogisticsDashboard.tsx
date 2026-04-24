import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GenericModal, ConfirmModal } from "@/components/shared/GenericModal";
import {
    Truck, PackageCheck, Clock, MapPin, Calendar,
    ChevronRight, CheckCircle2, Package,
} from "lucide-react";
import { useLogistics } from "../hooks/useLogistics";
import type { LogisticOrder, DeliverDto } from "../types/logistics.type";
import { sileo } from "sileo";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SkeletonCard = () => (
    <div className="rounded-xl border border-slate-100 p-4 space-y-3 animate-pulse">
        <div className="flex justify-between">
            <div className="h-4 w-16 bg-slate-100 rounded" />
            <div className="h-4 w-20 bg-slate-100 rounded" />
        </div>
        <div className="h-3 w-32 bg-slate-100 rounded" />
        <div className="h-3 w-48 bg-slate-100 rounded" />
    </div>
);

const clienteNombre = (o: LogisticOrder) =>
    o.cliente ? `${o.cliente.nombre} ${o.cliente.apellido}` : `Cliente #${o.clienteId}`;

// ─── Tarjeta de pedido ─────────────────────────────────────────────────────────

const OrderCard = ({
    order,
    action,
}: {
    order: LogisticOrder;
    action: React.ReactNode;
}) => (
    <div className="group rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
            <div>
                <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 text-sm">#{order.id}</span>
                    {order.estado === "EN_CAMINO" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                            <Truck className="w-2.5 h-2.5" /> En camino
                        </span>
                    )}
                    {order.estado === "ENTREGADO" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Entregado
                        </span>
                    )}
                    {order.estado === "PAGADO" && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-2.5 h-2.5" /> Por despachar
                        </span>
                    )}
                </div>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{clienteNombre(order)}</p>
            </div>
            <span className="font-bold text-slate-800 text-sm tabular-nums shrink-0">
                S/ {Number(order.total).toFixed(2)}
            </span>
        </div>

        {/* Productos */}
        <div className="flex flex-wrap gap-1.5">
            {order.detalles.slice(0, 3).map((d, i) => (
                <span key={i} className="text-[11px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-100">
                    {d.producto?.nombre ?? `#${d.productoId}`}
                    {d.talla && ` · ${d.talla.nombre}`}
                    {d.color && ` · ${d.color.nombre}`}
                    <span className="text-slate-400 ml-1">×{d.cantidad}</span>
                </span>
            ))}
            {order.detalles.length > 3 && (
                <span className="text-[11px] text-slate-400 px-1">+{order.detalles.length - 3} más</span>
            )}
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-50">
            <div className="flex items-center gap-3 text-xs text-slate-400">
                {order.direccionEnvio ? (
                    <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[160px]">{order.direccionEnvio}</span>
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3 h-3" /> Sin dirección
                    </span>
                )}
                {order.fechaEntrega && (
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(order.fechaEntrega).toLocaleDateString("es-PE")}
                    </span>
                )}
            </div>
            {action}
        </div>
    </div>
);

// ─── Modal entregar ────────────────────────────────────────────────────────────

const DeliverModal = ({
    order, onConfirm, onClose, isLoading,
}: {
    order: LogisticOrder;
    onConfirm: (dto: DeliverDto) => void;
    onClose: () => void;
    isLoading: boolean;
}) => {
    const [direccion, setDireccion] = useState(order.direccionEnvio ?? "");
    const [fecha,     setFecha]     = useState(new Date().toISOString().slice(0, 10));
    const [obs,       setObs]       = useState("");

    return (
        <div className="space-y-4 text-sm">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="font-medium text-emerald-800">Pedido <span className="font-mono">#{order.id}</span></p>
                <p className="text-emerald-700 mt-0.5">{clienteNombre(order)}</p>
                <p className="text-xs text-emerald-600 mt-1 font-bold">S/ {Number(order.total).toFixed(2)}</p>
            </div>
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Dirección de entrega</label>
                    <Input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Av. Principal 123..." />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Fecha de entrega</label>
                    <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Observaciones <span className="text-slate-400">(opcional)</span></label>
                    <Input value={obs} onChange={e => setObs(e.target.value)} placeholder="Notas del repartidor..." />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => onConfirm({ direccionEnvio: direccion || undefined, fechaEntrega: fecha, observaciones: obs || undefined })}
                    disabled={isLoading}
                >
                    {isLoading ? "Procesando..." : "Confirmar Entrega"}
                </Button>
            </div>
        </div>
    );
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export const LogisticsDashboard = () => {
    const { pending, inTransit, isLoading, dispatch, deliver } = useLogistics();
    const [dispatchingId,   setDispatchingId]   = useState<number | null>(null);
    const [deliveringOrder, setDeliveringOrder] = useState<LogisticOrder | null>(null);
    const [actionLoading,   setActionLoading]   = useState(false);

    const handleDispatch = async () => {
        if (!dispatchingId) return;
        setActionLoading(true);
        const ok = await dispatch(dispatchingId);
        setActionLoading(false);
        if (ok) {
            sileo.success({ title: "Despachado", description: `Pedido #${dispatchingId} está en camino.` });
            setDispatchingId(null);
        } else {
            sileo.error({ title: "Error", description: "No se pudo despachar el pedido." });
        }
    };

    const handleDeliver = async (dto: DeliverDto) => {
        if (!deliveringOrder) return;
        setActionLoading(true);
        const ok = await deliver(deliveringOrder.id, dto);
        setActionLoading(false);
        if (ok) {
            sileo.success({ title: "Entregado", description: `Pedido #${deliveringOrder.id} marcado como entregado.` });
            setDeliveringOrder(null);
        } else {
            sileo.error({ title: "Error", description: "No se pudo registrar la entrega." });
        }
    };

    const enCamino    = inTransit.filter(o => o.estado === "EN_CAMINO");
    const entregados  = inTransit.filter(o => o.estado === "ENTREGADO");

    return (
        <div className="space-y-6 pb-8">

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-violet-900 via-violet-800 to-purple-900 px-8 py-7 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(167,139,250,0.2),transparent_60%)]" />
                <div className="relative">
                    <p className="text-violet-300 text-xs font-semibold uppercase tracking-widest mb-1">Módulo ERP</p>
                    <h1 className="text-2xl font-bold text-white">Logística</h1>
                    <p className="text-violet-200/70 text-sm mt-1">Gestiona el despacho y entrega de pedidos pagados.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Por despachar", value: pending.length,    color: "amber",   bg: "bg-amber-50",   icon: <Clock className="w-4 h-4 text-amber-700" /> },
                    { label: "En camino",     value: enCamino.length,   color: "violet",  bg: "bg-violet-50",  icon: <Truck className="w-4 h-4 text-violet-700" /> },
                    { label: "Entregados",    value: entregados.length, color: "emerald", bg: "bg-emerald-50", icon: <PackageCheck className="w-4 h-4 text-emerald-700" /> },
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

            {/* Pendientes de despacho */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-slate-100 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">Pendientes de Despacho</CardTitle>
                            <CardDescription>Pedidos pagados listos para ser enviados al cliente.</CardDescription>
                        </div>
                        {pending.length > 0 && (
                            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
                                {pending.length} pendiente{pending.length !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : pending.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-3">
                                <Package className="w-7 h-7 text-amber-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500">Sin pedidos por despachar</p>
                            <p className="text-xs text-slate-400 mt-1">Los pedidos pagados aparecerán aquí.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {pending.map(o => (
                                <OrderCard
                                    key={o.id}
                                    order={o}
                                    action={
                                        <button
                                            onClick={() => setDispatchingId(o.id)}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors"
                                        >
                                            <Truck className="w-3.5 h-3.5" /> Despachar
                                            <ChevronRight className="w-3 h-3" />
                                        </button>
                                    }
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* En tránsito y entregados */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-slate-100 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">En Tránsito y Entregados</CardTitle>
                            <CardDescription>Seguimiento de pedidos despachados.</CardDescription>
                        </div>
                        {inTransit.length > 0 && (
                            <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
                                {inTransit.length} registros
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-4">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : inTransit.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14">
                            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-3">
                                <Truck className="w-7 h-7 text-violet-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500">Sin envíos activos</p>
                            <p className="text-xs text-slate-400 mt-1">Los pedidos despachados aparecerán aquí.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {inTransit.map(o => (
                                <OrderCard
                                    key={o.id}
                                    order={o}
                                    action={
                                        o.estado === "EN_CAMINO" ? (
                                            <button
                                                onClick={() => setDeliveringOrder(o)}
                                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                                            >
                                                <PackageCheck className="w-3.5 h-3.5" /> Entregar
                                            </button>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Completado
                                            </span>
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Confirm despachar */}
            <ConfirmModal
                isOpen={!!dispatchingId}
                onOpenChange={open => { if (!open) setDispatchingId(null); }}
                title="Despachar pedido"
                confirmLabel="Sí, despachar"
                variant="default"
                isLoading={actionLoading}
                onConfirm={handleDispatch}
                description={
                    <>
                        ¿Confirmas el despacho del pedido <strong className="text-slate-800">#{dispatchingId}</strong>?
                        <span className="block mt-1 text-slate-500">
                            El pedido pasará a estado "En camino" y el cliente será notificado.
                        </span>
                    </>
                }
            />

            {/* Modal entregar */}
            <GenericModal
                title={`Confirmar Entrega — Pedido #${deliveringOrder?.id}`}
                isOpen={!!deliveringOrder}
                onOpenChange={open => { if (!open) setDeliveringOrder(null); }}
                size="sm"
            >
                {deliveringOrder && (
                    <DeliverModal
                        order={deliveringOrder}
                        onConfirm={handleDeliver}
                        onClose={() => setDeliveringOrder(null)}
                        isLoading={actionLoading}
                    />
                )}
            </GenericModal>
        </div>
    );
};
