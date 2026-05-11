import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShoppingCart, MapPin, CreditCard, FileText, ChevronRight, Check, AlertCircle } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { createOrder } from "@/features/erp/orders/services/orders.service";
import { getMediosPago, getTiposComprobante } from "@/features/erp/orders/services/orders.service";
import type { MedioPago, TipoComprobante } from "@/features/erp/orders/types/orders.type";

const IGV_RATE = 0.18;

export function CheckoutPage() {
    const { items, total, clearCart } = useCart();
    const { user }    = useAuth();
    const navigate    = useNavigate();

    const [mediosPago,     setMediosPago]     = useState<MedioPago[]>([]);
    const [tiposComprobante, setTiposComprobante] = useState<TipoComprobante[]>([]);
    const [loading,        setLoading]        = useState(true);
    const [submitting,     setSubmitting]      = useState(false);
    const [error,          setError]           = useState<string | null>(null);
    const [success,        setSuccess]         = useState(false);

    const [direccion,      setDireccion]      = useState("");
    const [observaciones,  setObservaciones]  = useState("");
    const [medioPagoId,    setMedioPagoId]    = useState<number | null>(null);
    const [tipoDocId,      setTipoDocId]      = useState<number | null>(null);

    useEffect(() => {
        if (!user) { navigate("/login?redirect=/checkout"); return; }
        if (items.length === 0) { navigate("/catalog"); return; }

        Promise.all([getMediosPago(), getTiposComprobante()])
            .then(([mp, tc]) => {
                setMediosPago(mp);
                setTiposComprobante(tc);
                if (mp.length > 0) setMedioPagoId(mp[0].id);
                if (tc.length > 0) setTipoDocId(tc[0].id);
            })
            .catch(() => setError("No se pudieron cargar los métodos de pago."))
            .finally(() => setLoading(false));
    }, []);

    const subtotal    = total;
    const impuesto    = subtotal * IGV_RATE;
    const totalFinal  = subtotal + impuesto;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.clienteId) {
            setError("No se encontró tu perfil de cliente. Por favor vuelve a iniciar sesión.");
            return;
        }
        if (!medioPagoId) { setError("Selecciona un método de pago."); return; }
        if (!direccion.trim()) { setError("Ingresa tu dirección de envío."); return; }

        setError(null);
        setSubmitting(true);

        try {
            await createOrder({
                clienteId:        user.clienteId,
                usuarioId:        user.id,
                medioPagoId,
                tipoComprobanteId: tipoDocId ?? undefined,
                direccionEnvio:   direccion.trim(),
                observaciones:    observaciones.trim() || undefined,
                origen:           "ECOMMERCE",
                detalles: items.map(item => ({
                    productoId: item.productId,
                    tallaId:    item.tallaId   ?? 0,
                    colorId:    item.colorId   ?? 0,
                    cantidad:   item.cantidad,
                })),
            });

            clearCart();
            setSuccess(true);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            setError(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Ocurrió un error al procesar tu pedido."));
        } finally {
            setSubmitting(false);
        }
    };

    // ── Success screen ────────────────────────────────────────────────────────
    if (success) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center pt-20 px-6">
            <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md w-full text-center space-y-5">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">¡Pedido recibido!</h2>
                <p className="text-slate-500 text-sm leading-relaxed">
                    Hemos registrado tu pedido correctamente. Te contactaremos para confirmar la entrega.
                </p>
                <div className="flex flex-col gap-3 pt-2">
                    <Link to="/catalog" className="w-full bg-slate-900 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                        Seguir comprando
                    </Link>
                    <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        Ir al inicio
                    </Link>
                </div>
            </div>
        </div>
    );

    if (loading) return (
        <div className="min-h-screen bg-slate-50 pt-20 flex items-center justify-center">
            <div className="text-sm text-slate-500 animate-pulse">Cargando...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pt-20">
            <div className="max-w-5xl mx-auto px-6 py-10">

                {/* Header */}
                <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8">
                    <Link to="/" className="hover:text-slate-700">Inicio</Link>
                    <ChevronRight className="w-3 h-3" />
                    <Link to="/catalog" className="hover:text-slate-700">Catálogo</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 font-medium">Checkout</span>
                </nav>

                <h1 className="text-2xl font-black text-slate-900 mb-8">Finalizar compra</h1>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                        {/* ── Left: Form ── */}
                        <div className="lg:col-span-3 space-y-6">

                            {/* Delivery address */}
                            <div className="bg-white rounded-2xl border border-slate-100 p-6">
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <h2 className="font-bold text-slate-900">Dirección de envío</h2>
                                </div>
                                <textarea
                                    value={direccion}
                                    onChange={e => setDireccion(e.target.value)}
                                    placeholder="Ej: Av. Javier Prado 1234, San Isidro, Lima"
                                    rows={3}
                                    required
                                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none text-slate-800 placeholder-slate-400"
                                />
                                <textarea
                                    value={observaciones}
                                    onChange={e => setObservaciones(e.target.value)}
                                    placeholder="Observaciones o indicaciones (opcional)"
                                    rows={2}
                                    className="w-full mt-3 text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none text-slate-800 placeholder-slate-400"
                                />
                            </div>

                            {/* Payment method */}
                            <div className="bg-white rounded-2xl border border-slate-100 p-6">
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center shrink-0">
                                        <CreditCard className="w-4 h-4" />
                                    </div>
                                    <h2 className="font-bold text-slate-900">Método de pago</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {mediosPago.map(mp => (
                                        <button
                                            key={mp.id}
                                            type="button"
                                            onClick={() => setMedioPagoId(mp.id)}
                                            className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${medioPagoId === mp.id ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${medioPagoId === mp.id ? "border-slate-900 bg-slate-900" : "border-slate-300"}`}>
                                                {medioPagoId === mp.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">{mp.nombre}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Document type */}
                            {tiposComprobante.length > 0 && (
                                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center shrink-0">
                                            <FileText className="w-4 h-4" />
                                        </div>
                                        <h2 className="font-bold text-slate-900">Tipo de comprobante</h2>
                                    </div>
                                    <div className="flex gap-3">
                                        {tiposComprobante.map(td => (
                                            <button
                                                key={td.id}
                                                type="button"
                                                onClick={() => setTipoDocId(td.id)}
                                                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all ${tipoDocId === td.id ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"}`}
                                            >
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${tipoDocId === td.id ? "border-slate-900 bg-slate-900" : "border-slate-300"}`}>
                                                    {tipoDocId === td.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700">{td.nombre}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Right: Summary ── */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white rounded-2xl border border-slate-100 p-6 sticky top-24">
                                <div className="flex items-center gap-2 mb-5">
                                    <ShoppingCart className="w-4 h-4 text-slate-600" />
                                    <h2 className="font-bold text-slate-900">Resumen</h2>
                                </div>

                                {/* Items */}
                                <div className="space-y-3 mb-5">
                                    {items.map(item => (
                                        <div key={`${item.productId}-${item.tallaId}-${item.colorId}`} className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0 overflow-hidden">
                                                {item.imagenUrl
                                                    ? <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center text-xl">👕</div>
                                                }
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-slate-800 line-clamp-1">{item.nombre}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    {item.tallaNombre && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{item.tallaNombre}</span>}
                                                    {item.colorNombre && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{item.colorNombre}</span>}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-bold text-slate-900">S/ {(item.precio * item.cantidad).toFixed(2)}</p>
                                                <p className="text-[10px] text-slate-400">x{item.cantidad}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="border-t border-slate-100 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Subtotal</span>
                                        <span>S/ {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>IGV (18%)</span>
                                        <span>S/ {impuesto.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-black text-slate-900 text-base pt-1">
                                        <span>Total</span>
                                        <span>S/ {totalFinal.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="mt-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-rose-700">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full mt-5 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-colors"
                                >
                                    {submitting ? "Procesando..." : "Confirmar pedido"}
                                </button>

                                <p className="text-[10px] text-slate-400 text-center mt-3">
                                    Al confirmar aceptas nuestros términos. El pago se coordina al momento de la entrega.
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
