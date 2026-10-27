import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { getAllProducts } from "@/features/erp/products/services/products.service";
import type { Product } from "@/features/erp/products/types/Products.type";

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000/api";

const resolveImage = (src?: string) => {
    if (!src) return undefined;
    if (src.startsWith("http")) return src;
    return `${API_BASE.replace("/api", "")}/${src.replace(/^\//, "")}`;
};

const getPrecioFinal = (p: Product): number => {
    const precio = Number(p.precio);
    const descuento = Number(p.valorDescuento);
    if (p.tipoDescuento === "PORCENTAJE") return precio * (1 - descuento / 100);
    if (p.tipoDescuento === "VALOR_FIJO") return Math.max(0, precio - descuento);
    return precio;
};

export const FavoritesPage = () => {
    const { favorites, favoriteIds, removeFavorite, loading } = useFavorites();
    const { addItem } = useCart();
    const { user } = useAuth();

    // En caso de invitado o fallback, necesitamos los productos correspondientes a favoriteIds
    const [allCatalogProducts, setAllCatalogProducts] = useState<Product[]>([]);
    const [fetchingProducts, setFetchingProducts] = useState(false);

    useEffect(() => {
        // Si el usuario no está autenticado o la lista de favorites en el context viene vacía pero hay favoriteIds
        if (!user && favoriteIds.size > 0) {
            setFetchingProducts(true);
            getAllProducts()
                .then(products => setAllCatalogProducts(products))
                .catch(err => console.error("Error al cargar catálogo para favoritos:", err))
                .finally(() => setFetchingProducts(false));
        }
    }, [user, favoriteIds]);

    // Combinar los productos que son favoritos
    const favoriteProducts: Product[] = user
        ? favorites.map(f => f.producto).filter(Boolean) as Product[]
        : allCatalogProducts.filter(p => favoriteIds.has(p.id));

    const handleAddToCart = (product: Product) => {
        const precioFinal = getPrecioFinal(product);
        const imagen = resolveImage(product.imagenes?.[0]);
        addItem({
            productId: product.id,
            nombre: product.nombre,
            precio: precioFinal,
            imagenUrl: imagen,
            tallaId: product.tallas?.[0]?.id ?? null,
            tallaNombre: product.tallas?.[0]?.nombre,
            colorId: product.colores?.[0]?.id ?? null,
            colorNombre: product.colores?.[0]?.nombre,
            cantidad: 1,
        });
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200/80">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-semibold uppercase tracking-wider mb-3">
                            <Heart size={14} className="fill-rose-500 text-rose-500" />
                            Lista de deseos
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                            Mis Prendas Favoritas
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {favoriteIds.size === 1
                                ? "Tienes 1 prenda guardada en tu lista."
                                : `Tienes ${favoriteIds.size} prendas guardadas en tu lista.`}
                        </p>
                    </div>

                    <Link
                        to="/catalog"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl transition-all shadow-sm self-start md:self-auto"
                    >
                        Ver todo el catálogo
                        <ArrowRight size={16} />
                    </Link>
                </div>

                {/* Banner de sincronización para invitados */}
                {!user && favoriteIds.size > 0 && (
                    <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-amber-900">¿Deseas guardar tus favoritos de forma permanente?</h4>
                                <p className="text-xs text-amber-700/90 mt-0.5">
                                    Inicia sesión o regístrate para sincronizar tu lista de deseos en todos tus dispositivos.
                                </p>
                            </div>
                        </div>
                        <Link
                            to="/login"
                            className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-xl transition-colors shrink-0"
                        >
                            Iniciar sesión
                        </Link>
                    </div>
                )}

                {/* Contenido */}
                {loading || fetchingProducts ? (
                    <div className="py-24 text-center">
                        <div className="w-12 h-12 border-3 border-rose-500/30 border-t-rose-500 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-sm text-slate-500">Cargando tus prendas favoritas...</p>
                    </div>
                ) : favoriteIds.size === 0 || favoriteProducts.length === 0 ? (
                    /* Estado vacío */
                    <div className="py-20 text-center max-w-md mx-auto">
                        <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6 text-rose-400">
                            <Heart size={38} className="stroke-[1.5]" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Tu lista de favoritos está vacía</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                            Guarda las prendas que más te gusten haciendo clic en el corazón mientras exploras nuestra tienda.
                        </p>
                        <Link
                            to="/catalog"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                        >
                            Explorar catálogo ahora
                            <ArrowRight size={16} />
                        </Link>
                    </div>
                ) : (
                    /* Grid de favoritos */
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {favoriteProducts.map(product => {
                            const precioFinal = getPrecioFinal(product);
                            const tieneDescuento = product.tipoDescuento !== "SIN_DESCUENTO" && product.valorDescuento > 0;
                            const pctDescuento = tieneDescuento && product.tipoDescuento === "PORCENTAJE" ? product.valorDescuento : null;
                            const imagen = resolveImage(product.imagenes?.[0]);

                            return (
                                <div
                                    key={product.id}
                                    className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col"
                                >
                                    {/* Botón quitar favorito */}
                                    <button
                                        onClick={() => removeFavorite(product.id)}
                                        className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-xs rounded-full shadow flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all hover:scale-110"
                                        title="Quitar de favoritos"
                                    >
                                        <Trash2 size={14} />
                                    </button>

                                    {/* Badge descuento */}
                                    {tieneDescuento && (
                                        <span className="absolute top-3 left-3 z-10 text-[10px] font-bold px-2 py-1 rounded-full bg-rose-500 text-white">
                                            {pctDescuento ? `-${pctDescuento}%` : "Oferta"}
                                        </span>
                                    )}

                                    {/* Imagen */}
                                    <Link to={`/product/${product.id}`} className="block h-60 bg-slate-50 overflow-hidden flex items-center justify-center">
                                        {imagen ? (
                                            <img
                                                src={imagen}
                                                alt={product.nombre}
                                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <span className="text-6xl select-none">👕</span>
                                        )}
                                    </Link>

                                    {/* Info */}
                                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                        <div>
                                            {product.categoria && (
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                                    {product.categoria.nombre}
                                                </p>
                                            )}
                                            <Link
                                                to={`/product/${product.id}`}
                                                className="font-semibold text-slate-800 text-sm leading-snug line-clamp-2 hover:text-slate-900 group-hover:text-slate-900 transition-colors"
                                            >
                                                {product.nombre}
                                            </Link>
                                        </div>

                                        {/* Precios */}
                                        <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                                            <div>
                                                <span className="text-base font-extrabold text-slate-900">
                                                    S/ {precioFinal.toFixed(2)}
                                                </span>
                                                {tieneDescuento && (
                                                    <span className="ml-2 text-xs text-slate-400 line-through">
                                                        S/ {Number(product.precio).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Acciones */}
                                        <div className="pt-1 flex gap-2">
                                            <button
                                                onClick={() => handleAddToCart(product)}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
                                            >
                                                <ShoppingCart size={14} />
                                                Al Carrito
                                            </button>
                                            <Link
                                                to={`/product/${product.id}`}
                                                className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
                                            >
                                                Ver
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
