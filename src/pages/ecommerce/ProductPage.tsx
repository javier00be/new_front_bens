import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, Star, ChevronLeft, Shield, Truck, RefreshCw, Check, Minus, Plus } from "lucide-react";
import { getProductById } from "@/features/erp/products/services/products.service";
import type { Product }   from "@/features/erp/products/types/Products.type";
import { useCart }        from "@/contexts/CartContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000/api";

const resolveImage = (src?: string) => {
    if (!src) return undefined;
    if (src.startsWith("http")) return src;
    return `${API_BASE.replace("/api", "")}/${src.replace(/^\//, "")}`;
};

const isLight = (hex: string): boolean => {
    const c = hex.trim().replace("#", "");
    if (c.length < 6) return true;
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
};

const aplicarDescuento = (precio: number, p: Product): number => {
    const descuento = Number(p.valorDescuento);
    if (p.tipoDescuento === "PORCENTAJE") return precio * (1 - descuento / 100);
    if (p.tipoDescuento === "VALOR_FIJO") return Math.max(0, precio - descuento);
    return precio;
};

// ─── StarRating ───────────────────────────────────────────────────────────────

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1">
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={14} className={s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} />
            ))}
        </div>
        <span className="text-sm text-slate-500">{rating.toFixed(1)}</span>
    </div>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = () => (
    <div className="min-h-screen bg-white pt-20 animate-pulse">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-slate-100 rounded-3xl" />
            <div className="space-y-4 py-4">
                <div className="h-4 w-24 bg-slate-100 rounded" />
                <div className="h-9 w-3/4 bg-slate-100 rounded" />
                <div className="h-6 w-32 bg-slate-100 rounded" />
                <div className="h-20 w-full bg-slate-100 rounded" />
                <div className="h-12 w-full bg-slate-100 rounded-xl" />
            </div>
        </div>
    </div>
);

// ─── ProductPage ──────────────────────────────────────────────────────────────

export function ProductPage() {
    const { id }        = useParams<{ id: string }>();
    const navigate      = useNavigate();
    const { addItem }   = useCart();

    const [product,      setProduct]      = useState<Product | null>(null);
    const [loading,      setLoading]      = useState(true);
    const [notFound,     setNotFound]     = useState(false);
    const [activeImage,  setActiveImage]  = useState(0);
    const [selectedTalla, setSelectedTalla] = useState<number | null>(null);
    const [selectedColor, setSelectedColor] = useState<number | null>(null);
    const [cantidad,      setCantidad]    = useState(1);
    const [wished,        setWished]      = useState(false);
    const [added,         setAdded]       = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        getProductById(Number(id))
            .then(data => {
                setProduct(data);
                // Inicializa con la primera variante del inventario
                const firstInv = data.inventarios?.[0];
                setSelectedTalla(firstInv?.tallaId ?? data.tallas?.[0]?.id ?? null);
                setSelectedColor(firstInv?.colorId ?? data.colores?.[0]?.id ?? null);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoading(false));
    }, [id]);

    // Tallas únicas derivadas del inventario real
    const tallasDisponibles = useMemo(() => {
        if (!product?.inventarios?.length) return product?.tallas ?? [];
        const seen = new Set<number>();
        return product.inventarios
            .filter(inv => { if (seen.has(inv.tallaId)) return false; seen.add(inv.tallaId); return true; })
            .map(inv => inv.talla);
    }, [product]);

    // Colores disponibles para la talla seleccionada
    const coloresDisponibles = useMemo(() => {
        if (!product?.inventarios?.length) return product?.colores ?? [];
        const filtrados = selectedTalla
            ? product.inventarios.filter(inv => inv.tallaId === selectedTalla)
            : product.inventarios;
        const seen = new Set<number>();
        return filtrados
            .filter(inv => { if (seen.has(inv.colorId)) return false; seen.add(inv.colorId); return true; })
            .map(inv => inv.color);
    }, [product, selectedTalla]);

    // Precio base de la variante seleccionada (desde inventario)
    const precioVariante = useMemo(() => {
        if (!product) return 0;
        const inv = product.inventarios?.find(
            i => i.tallaId === selectedTalla && i.colorId === selectedColor
        );
        if (inv && Number(inv.precio) > 0) return Number(inv.precio);
        // Fallback: primer inventario de esa talla, luego precio base del producto
        const byTalla = selectedTalla
            ? product.inventarios?.find(i => i.tallaId === selectedTalla)
            : null;
        if (byTalla && Number(byTalla.precio) > 0) return Number(byTalla.precio);
        return Number(product.precio);
    }, [product, selectedTalla, selectedColor]);

    if (loading) return <Skeleton />;

    if (notFound || !product) return (
        <div className="min-h-screen flex flex-col items-center justify-center pt-20 text-center px-6">
            <span className="text-6xl mb-4">😕</span>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Producto no encontrado</h2>
            <p className="text-slate-500 mb-6">Es posible que haya sido removido o el enlace es incorrecto.</p>
            <Link to="/catalog" className="px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl text-sm">
                Ver catálogo
            </Link>
        </div>
    );

    const imagenes       = (product.imagenes ?? []).map(resolveImage).filter(Boolean) as string[];
    const precioFinal    = aplicarDescuento(precioVariante, product);
    const tieneDescuento = product.tipoDescuento !== "SIN_DESCUENTO" && Number(product.valorDescuento) > 0;
    const pctDescuento   = tieneDescuento && product.tipoDescuento === "PORCENTAJE" ? Number(product.valorDescuento) : null;

    const selectedTallaObj = tallasDisponibles.find(t => t.id === selectedTalla);
    const selectedColorObj = coloresDisponibles.find(c => c.id === selectedColor);

    const handleAddToCart = () => {
        if (!product) return;
        addItem({
            productId:   product.id,
            nombre:      product.nombre,
            precio:      precioFinal,
            imagenUrl:   imagenes[0],
            tallaId:     selectedTalla,
            tallaNombre: selectedTallaObj?.nombre,
            colorId:     selectedColor,
            colorNombre: selectedColorObj?.nombre,
            cantidad,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <div className="min-h-screen bg-white pt-20">
            <div className="max-w-6xl mx-auto px-6 py-10">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8">
                    <Link to="/" className="hover:text-slate-700 transition-colors">Inicio</Link>
                    <span>/</span>
                    <Link to="/catalog" className="hover:text-slate-700 transition-colors">Catálogo</Link>
                    {product.categoria && (
                        <>
                            <span>/</span>
                            <Link to={`/catalog?categoria=${product.categoria.id}`} className="hover:text-slate-700 transition-colors">
                                {product.categoria.nombre}
                            </Link>
                        </>
                    )}
                    <span>/</span>
                    <span className="text-slate-600 font-medium truncate max-w-[200px]">{product.nombre}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">

                    {/* ── Images ── */}
                    <div className="space-y-3">
                        {/* Main image */}
                        <div className="relative aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-100">
                            {imagenes.length > 0 ? (
                                <img src={imagenes[activeImage]} alt={product.nombre} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-8xl">👕</div>
                            )}
                            {tieneDescuento && (
                                <span className="absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full bg-rose-500 text-white shadow">
                                    {pctDescuento ? `-${pctDescuento}%` : "Oferta"}
                                </span>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {imagenes.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                                {imagenes.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveImage(i)}
                                        className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImage === i ? "border-slate-900" : "border-transparent hover:border-slate-300"}`}
                                    >
                                        <img src={img} alt={`Vista ${i + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Info ── */}
                    <div className="flex flex-col gap-5 py-2">
                        {/* Header */}
                        <div>
                            {product.categoria && (
                                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    {product.categoria.nombre}
                                    {product.marca && ` · ${product.marca.nombre}`}
                                </p>
                            )}
                            <h1 className="text-3xl font-black text-slate-900 leading-tight mb-3">{product.nombre}</h1>
                            <StarRating rating={4.5} />
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-black text-slate-900">S/ {precioFinal.toFixed(2)}</span>
                            {tieneDescuento && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xl text-slate-400 line-through">S/ {precioVariante.toFixed(2)}</span>
                                    <span className="text-sm font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg">
                                        {pctDescuento ? `-${pctDescuento}%` : "Oferta"}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {product.descripcion || <span className="italic text-slate-400">Sin descripción</span>}
                        </p>

                        {/* Talla selector */}
                        {tallasDisponibles.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2.5">
                                    Talla: <span className="text-slate-500 font-normal normal-case tracking-normal">{selectedTallaObj?.nombre ?? "—"}</span>
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {tallasDisponibles.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => {
                                                setSelectedTalla(t.id);
                                                // Resetea al primer color disponible para esta talla
                                                const firstColor = product.inventarios?.find(i => i.tallaId === t.id);
                                                setSelectedColor(firstColor?.colorId ?? null);
                                            }}
                                            className={`min-w-11 px-3 py-2 text-sm font-semibold rounded-xl border-2 transition-all ${selectedTalla === t.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:border-slate-400"}`}
                                        >
                                            {t.nombre}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Color selector */}
                        {coloresDisponibles.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2.5">
                                    Color:{" "}
                                    {selectedColorObj && (
                                        <span className="inline-flex items-center gap-1.5 font-normal normal-case tracking-normal">
                                            <span
                                                className="inline-block w-3 h-3 rounded-full border border-slate-300"
                                                style={{ backgroundColor: selectedColorObj.nombre.trim() }}
                                            />
                                            <span className="text-slate-500">{selectedColorObj.nombre}</span>
                                        </span>
                                    )}
                                </p>
                                <div className="flex flex-wrap gap-2.5">
                                    {coloresDisponibles.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedColor(c.id)}
                                            title={c.nombre}
                                            className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                                                selectedColor === c.id
                                                    ? "border-slate-900 scale-110 shadow-md"
                                                    : "border-slate-200 hover:border-slate-400 hover:scale-105"
                                            }`}
                                            style={{ backgroundColor: c.nombre.trim() }}
                                        >
                                            {selectedColor === c.id && (
                                                <Check
                                                    size={14}
                                                    className="drop-shadow"
                                                    style={{ color: isLight(c.nombre) ? "#1e293b" : "#ffffff" }}
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity */}
                        <div>
                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2.5">Cantidad</p>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setCantidad(q => Math.max(1, q - 1))}
                                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 text-slate-600 transition-colors"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="w-10 text-center text-sm font-bold text-slate-900">{cantidad}</span>
                                    <button
                                        onClick={() => setCantidad(q => q + 1)}
                                        className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 text-slate-600 transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={handleAddToCart}
                                className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-sm transition-all ${added ? "bg-emerald-600 text-white" : "bg-slate-900 hover:bg-slate-700 text-white"}`}
                            >
                                {added ? <><Check size={16} /> Agregado</> : <><ShoppingCart size={16} /> Agregar al carrito</>}
                            </button>
                            <button
                                onClick={() => setWished(w => !w)}
                                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${wished ? "border-rose-300 bg-rose-50 text-rose-500" : "border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500"}`}
                            >
                                <Heart size={18} className={wished ? "fill-rose-500" : ""} />
                            </button>
                        </div>

                        {/* Perks */}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                            {[
                                { icon: Truck,     label: "Envío rápido"       },
                                { icon: Shield,    label: "Compra segura"      },
                                { icon: RefreshCw, label: "30 días de cambios" },
                            ].map(({ icon: Icon, label }) => (
                                <div key={label} className="flex flex-col items-center gap-1.5 p-3 bg-slate-50 rounded-xl text-center">
                                    <Icon size={15} className="text-slate-500" />
                                    <p className="text-[10px] font-medium text-slate-600 leading-tight">{label}</p>
                                </div>
                            ))}
                        </div>

                        {/* SKU */}
                        {product.sku && (
                            <p className="text-xs text-slate-400">SKU: {product.sku}</p>
                        )}
                    </div>
                </div>

                {/* Back link */}
                <div className="mt-14 pt-8 border-t border-slate-100">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                        <ChevronLeft size={15} /> Volver
                    </button>
                </div>
            </div>
        </div>
    );
}
