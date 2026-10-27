import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "./AuthContext";
import {
    getMyFavorites,
    toggleFavoriteApi,
    removeFavoriteApi,
    type FavoriteItem,
} from "@/features/ecommerce/favorites/services/favorites.service";

interface FavoritesContextType {
    favorites: FavoriteItem[];
    favoriteIds: Set<number>;
    isFavorite: (productId: number) => boolean;
    toggleFavorite: (productId: number) => Promise<boolean>;
    removeFavorite: (productId: number) => Promise<void>;
    count: number;
    loading: boolean;
    refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

const STORAGE_KEY = "bens_guest_favorites";

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [guestIds, setGuestIds] = useState<number[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(false);

    // Guardar guest IDs en localStorage si no está autenticado
    useEffect(() => {
        if (!user) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(guestIds));
        }
    }, [guestIds, user]);

    // Cargar favoritos del backend cuando el usuario inicia sesión
    const refreshFavorites = useCallback(async () => {
        if (!user) {
            setFavorites([]);
            return;
        }
        setLoading(true);
        try {
            const data = await getMyFavorites();
            setFavorites(data);
        } catch (err) {
            console.error("Error al cargar favoritos:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refreshFavorites();
    }, [refreshFavorites]);

    // Sincronizar favoritos guardados como invitado al loguearse
    useEffect(() => {
        if (user && guestIds.length > 0) {
            const syncGuests = async () => {
                for (const pid of guestIds) {
                    try {
                        await toggleFavoriteApi(pid);
                    } catch {
                        // ignore error
                    }
                }
                localStorage.removeItem(STORAGE_KEY);
                setGuestIds([]);
                await refreshFavorites();
            };
            syncGuests();
        }
    }, [user, guestIds, refreshFavorites]);

    // Conjunto de IDs favoritos para chequeo instantáneo O(1)
    const favoriteIds = useMemo(() => {
        if (user) {
            return new Set(favorites.map((f) => f.productoId));
        }
        return new Set(guestIds);
    }, [user, favorites, guestIds]);

    const isFavorite = useCallback(
        (productId: number) => favoriteIds.has(productId),
        [favoriteIds]
    );

    const toggleFavorite = useCallback(
        async (productId: number): Promise<boolean> => {
            if (!user) {
                // Modo invitado (offline / local)
                let willBeFav = false;
                setGuestIds((prev) => {
                    if (prev.includes(productId)) {
                        willBeFav = false;
                        return prev.filter((id) => id !== productId);
                    } else {
                        willBeFav = true;
                        return [...prev, productId];
                    }
                });
                return willBeFav;
            }

            // Modo autenticado: actualización optimista
            const currentlyFav = favoriteIds.has(productId);
            const willBeFav = !currentlyFav;

            // Optimismo
            if (currentlyFav) {
                setFavorites((prev) => prev.filter((f) => f.productoId !== productId));
            }

            try {
                const res = await toggleFavoriteApi(productId);
                await refreshFavorites();
                return res.isFavorite;
            } catch (err) {
                console.error("Error toggling favorite:", err);
                await refreshFavorites(); // rollback
                return currentlyFav;
            }
        },
        [user, favoriteIds, refreshFavorites]
    );

    const removeFavorite = useCallback(
        async (productId: number) => {
            if (!user) {
                setGuestIds((prev) => prev.filter((id) => id !== productId));
                return;
            }

            setFavorites((prev) => prev.filter((f) => f.productoId !== productId));
            try {
                await removeFavoriteApi(productId);
            } catch (err) {
                console.error("Error removing favorite:", err);
                await refreshFavorites();
            }
        },
        [user, refreshFavorites]
    );

    const count = favoriteIds.size;

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                favoriteIds,
                isFavorite,
                toggleFavorite,
                removeFavorite,
                count,
                loading,
                refreshFavorites,
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const ctx = useContext(FavoritesContext);
    if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
    return ctx;
};
