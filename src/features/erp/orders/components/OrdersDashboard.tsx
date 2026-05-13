import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GenericModal, ConfirmModal } from "@/components/shared/GenericModal";
import {
    ShoppingCart, CreditCard, Eye, ChevronLeft, ChevronRight,
    Clock, RefreshCw, CheckCircle2, Truck, Package, XCircle,
    ChevronDown, Layers,
} from "lucide-react";
import { useOrders } from "../hooks/useOrders";
import { EstadoPedido, type Order, type CreateOrderDto, type MedioPago } from "../types/orders.type";
import { OrderForm } from "./OrderForm";
import { getMediosPago } from "../services/orders.service";
import { sileo } from "sileo";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoPedido, { label: string; badge: string; icon: React.ElementType }> = {
    PENDIENTE:  { label: "Pendiente",  badge: "bg-amber-50 text-amber-700 border border-amber-200",    icon: Clock       },
    PROCESANDO: { label: "Procesando", badge: "bg-blue-50 text-blue-700 border border-blue-200",       icon: RefreshCw   },
    PAGADO:     { label: "Pagado",     badge: "bg-emerald-50 text-emerald-700 border border-emerald-200", icon: CheckCircle2 },
    EN_CAMINO:  { label: "En camino",  badge: "bg-violet-50 text-violet-700 border border-violet-200", icon: Truck       },
    ENTREGADO:  { label: "Entregado",  badge: "bg-indigo-50 text-indigo-700 border border-indigo-200", icon: Package     },
    CANCELADO:  { label: "Cancelado",  badge: "bg-rose-50 text-rose-600 border border-rose-200",       icon: XCircle     },
};

const ITEMS_PER_PAGE = 10;

const SkeletonRow = () => (
    <tr className="border-b border-slate-100">
        {[40, 120, 80, 80, 90, 80, 70].map((w, i) => (
            <td key={i} className="px-5 py-4">
                <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: w }} />
            </td>
        ))}
    </tr>
);

// ─── Modal detalle ─────────────────────────────────────────────────────────────

const OrderDetailModal = ({ order, onClose }: { order: Order; onClose: () => void }) => (
    <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-slate-50 rounded-xl p-4">
            <div><span className="text-slate-500 text-xs">Cliente</span><p className="font-medium text-slate-800">{order.cliente ? `${order.cliente.nombre} ${order.cliente.apellido}` : `#${order.clienteId}`}</p></div>
            <div><span className="text-slate-500 text-xs">Origen</span><p className="font-medium text-slate-800">{order.origen}</p></div>
            <div><span className="text-slate-500 text-xs">Medio de pago</span><p className="font-medium text-slate-800">{order.medioPago?.nombre ?? "—"}</p></div>
            <div><span className="text-slate-500 text-xs">Comprobante</span><p className="font-medium text-slate-800">{order.tipoComprobante?.abreviatura ?? "—"}</p></div>
            {order.direccionEnvio && <div className="col-span-2"><span className="text-slate-500 text-xs">Dirección</span><p className="font-medium text-slate-800">{order.direccionEnvio}</p></div>}
            {order.cupon && <div><span className="text-slate-500 text-xs">Cupón</span><p className="font-medium text-emerald-600">{order.cupon.codigo}</p></div>}
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
                {order.detalles.map((d, i) => (
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

        <div className="flex flex-col items-end gap-1 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Subtotal: <b>S/ {Number(order.subtotal).toFixed(2)}</b></span>
            {Number(order.descuento) > 0 && <span className="text-rose-500">Descuento: −S/ {Number(order.descuento).toFixed(2)}</span>}
            {Number(order.descuentoCupon) > 0 && <span className="text-emerald-600">Cupón: −S/ {Number(order.descuentoCupon).toFixed(2)}</span>}
            <span className="text-slate-500">IGV (18%): S/ {Number(order.impuesto).toFixed(2)}</span>
            <span className="text-base font-bold text-slate-900 mt-1">Total: S/ {Number(order.total).toFixed(2)}</span>
        </div>

        <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cerrar</Button>
        </div>
    </div>
);

// ─── Modal confirmar pago ──────────────────────────────────────────────────────

const PayModal = ({
    order, mediosPago, onConfirm, onClose, isLoading,
}: {
    order: Order; mediosPago: MedioPago[];
    onConfirm: (medioPagoId: number) => void;
    onClose: () => void; isLoading: boolean;
}) => {
    const [selected, setSelected] = useState<number>(order.medioPagoId ?? mediosPago[0]?.id ?? 0);
    return (
        <div className="space-y-4 text-sm">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="text-emerald-800 font-medium">Pedido <span className="font-mono">#{order.id}</span></p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">S/ {Number(order.total).toFixed(2)}</p>
                <p className="text-xs text-emerald-600 mt-0.5">{order.cliente ? `${order.cliente.nombre} ${order.cliente.apellido}` : `Cliente #${order.clienteId}`}</p>
            </div>
            <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Medio de pago</label>
                <div className="relative">
                    <select
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={selected}
                        onChange={e => setSelected(Number(e.target.value))}
                    >
                        {mediosPago.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
            </div>
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
                Al confirmar el pago, se generará automáticamente una Venta en el sistema.
            </p>
            <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => onConfirm(selected)} disabled={isLoading || !selected}>
                    {isLoading ? "Procesando..." : "Confirmar Pago"}
                </Button>
            </div>
        </div>
    );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const OrdersDashboard = () => {
    const { orders, isLoading, addOrder, payOrder, cancelOrder } = useOrders();
    const [isCreateOpen,  setIsCreateOpen]  = useState(false);
    const [detailOrder,   setDetailOrder]   = useState<Order | null>(null);
    const [payingOrder,   setPayingOrder]   = useState<Order | null>(null);
    const [cancelingId,   setCancelingId]   = useState<number | null>(null);
    const [mediosPago,    setMediosPago]    = useState<MedioPago[]>([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [currentPage,   setCurrentPage]   = useState(1);

    useEffect(() => {
        getMediosPago().then(setMediosPago).catch(() => {});
    }, []);

    const handleCreate = async (dto: CreateOrderDto) => {
        const result = await addOrder(dto);
        if (result) {
            sileo.success({ title: "Pedido creado", description: `Pedido #${result.id} registrado correctamente.` });
            setIsCreateOpen(false);
        } else {
            sileo.error({ title: "Error", description: "No se pudo crear el pedido." });
        }
    };

    const handlePay = async (medioPagoId: number) => {
        if (!payingOrder) return;
        setActionLoading(true);
        const result = await payOrder(payingOrder.id, medioPagoId);
        setActionLoading(false);
        if (result) {
            sileo.success({ title: "Pago confirmado", description: `Pedido #${payingOrder.id} marcado como PAGADO. Venta generada.` });
            setPayingOrder(null);
        } else {
            sileo.error({ title: "Error", description: "No se pudo confirmar el pago." });
        }
    };

    const handleCancel = async () => {
        if (!cancelingId) return;
        setActionLoading(true);
        const result = await cancelOrder(cancelingId);
        setActionLoading(false);
        if (result) {
            sileo.success({ title: "Pedido cancelado", description: `Pedido #${cancelingId} cancelado. Stock devuelto.` });
            setCancelingId(null);
        } else {
            sileo.error({ title: "Error", description: "No se pudo cancelar el pedido." });
        }
    };

    // Stats
    const pendientes  = orders.filter(o => o.estado === "PENDIENTE").length;
    const procesando  = orders.filter(o => o.estado === "PROCESANDO").length;
    const pagados     = orders.filter(o => o.estado === "PAGADO" || o.estado === "EN_CAMINO" || o.estado === "ENTREGADO").length;
    const cancelados  = orders.filter(o => o.estado === "CANCELADO").length;

    // Paginación
    const totalPages     = Math.ceil(orders.length / ITEMS_PER_PAGE);
    const paginatedOrders = orders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="space-y-6 pb-8">

            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-900 via-indigo-800 to-violet-900 px-8 py-7 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(129,140,248,0.25),transparent_60%)]" />
                <div className="relative flex items-center justify-between">
                    <div>
                        <p className="text-indigo-300 text-xs font-semibold uppercase tracking-widest mb-1">Módulo ERP</p>
                        <h1 className="text-2xl font-bold text-white">Pedidos</h1>
                        <p className="text-indigo-200/70 text-sm mt-1">Crea y gestiona los pedidos de clientes desde el ERP.</p>
                    </div>
                    <Button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-lg backdrop-blur-sm"
                    >
                        <ShoppingCart className="w-4 h-4 mr-2" /> Nuevo Pedido
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Pendientes",  value: pendientes, color: "amber",   bg: "bg-amber-50",   icon: <Clock className="w-4 h-4 text-amber-700" /> },
                    { label: "Procesando",  value: procesando, color: "blue",    bg: "bg-blue-50",    icon: <RefreshCw className="w-4 h-4 text-blue-700" /> },
                    { label: "Completados", value: pagados,    color: "emerald", bg: "bg-emerald-50", icon: <CheckCircle2 className="w-4 h-4 text-emerald-700" /> },
                    { label: "Cancelados",  value: cancelados, color: "rose",    bg: "bg-rose-50",    icon: <XCircle className="w-4 h-4 text-rose-600" /> },
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
                            <CardTitle className="text-lg">Historial de Pedidos</CardTitle>
                            <CardDescription>Todos los pedidos registrados en el sistema ERP y Ecommerce.</CardDescription>
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-full">
                            {orders.length} registros
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80">
                                    {["#", "Cliente", "Origen", "Total", "Estado", "Fecha", "Acciones"].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</tbody>
                        </table>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                                <ShoppingCart className="w-8 h-8 text-indigo-300" />
                            </div>
                            <p className="text-sm font-semibold text-slate-500 mb-4">Sin pedidos registrados</p>
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsCreateOpen(true)}>
                                <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Crear primer pedido
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/80">
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">#</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cliente</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Origen</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                                        <th className="px-3 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {paginatedOrders.map(o => {
                                        const cfg = ESTADO_CONFIG[o.estado];
                                        const Icon = cfg.icon;
                                        const isTerminado = o.estado === "ENTREGADO" || o.estado === "CANCELADO";
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
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-slate-700">
                                                                {o.cliente ? `${o.cliente.nombre} ${o.cliente.apellido}` : `Cliente #${o.clienteId}`}
                                                            </span>
                                                            {o.cliente?.correo && (
                                                                <span className="text-[11px] text-slate-400">{o.cliente.correo}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${o.origen === "ERP" ? "bg-indigo-50 text-indigo-600" : "bg-violet-50 text-violet-600"}`}>
                                                        {o.origen}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="font-bold text-sm text-slate-800">S/ {Number(o.total).toFixed(2)}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${cfg.badge}`}>
                                                        <Icon className="w-3 h-3" /> {cfg.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-sm text-slate-500">
                                                        {new Date(o.createdAt).toLocaleDateString("es-PE")}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => setDetailOrder(o)}
                                                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-colors"
                                                            title="Ver detalle"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                        </button>
                                                        {o.estado === "PENDIENTE" && (
                                                            <button
                                                                onClick={() => setPayingOrder(o)}
                                                                className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors"
                                                                title="Confirmar pago"
                                                            >
                                                                <CreditCard className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                        {(o.estado === "PENDIENTE" || o.estado === "PROCESANDO") && (
                                                            <button
                                                                onClick={() => setCancelingId(o.id)}
                                                                className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 flex items-center justify-center transition-colors"
                                                                title="Cancelar pedido"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
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

            {/* Modal: Nueva orden */}
            <GenericModal
                title="Nuevo Pedido"
                description="Completa los datos del cliente, productos y método de pago."
                isOpen={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                size="lg"
                scrollable
            >
                <OrderForm onSuccess={handleCreate} onCancel={() => setIsCreateOpen(false)} />
            </GenericModal>

            {/* Modal: Ver detalle */}
            <GenericModal
                title={`Detalle del Pedido #${detailOrder?.id}`}
                isOpen={!!detailOrder}
                onOpenChange={open => { if (!open) setDetailOrder(null); }}
                size="md"
                scrollable
            >
                {detailOrder && <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />}
            </GenericModal>

            {/* Modal: Confirmar pago */}
            <GenericModal
                title="Confirmar Pago"
                isOpen={!!payingOrder}
                onOpenChange={open => { if (!open) setPayingOrder(null); }}
                size="sm"
            >
                {payingOrder && (
                    <PayModal
                        order={payingOrder}
                        mediosPago={mediosPago}
                        onConfirm={handlePay}
                        onClose={() => setPayingOrder(null)}
                        isLoading={actionLoading}
                    />
                )}
            </GenericModal>

            {/* Confirm cancelar */}
            <ConfirmModal
                isOpen={!!cancelingId}
                onOpenChange={open => { if (!open) setCancelingId(null); }}
                title="Cancelar pedido"
                confirmLabel="Sí, cancelar"
                variant="danger"
                isLoading={actionLoading}
                onConfirm={handleCancel}
                description={
                    <>
                        ¿Cancelar el pedido <strong className="text-slate-800">#{cancelingId}</strong>?
                        <span className="block mt-1 text-slate-500">
                            El stock de los productos será devuelto automáticamente al inventario.
                        </span>
                    </>
                }
            />
        </div>
    );
};

export default OrdersDashboard;
