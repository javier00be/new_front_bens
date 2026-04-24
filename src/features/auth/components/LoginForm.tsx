import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logoHori from "@/assets/images/logos/logoHori.png";
import loginImage from "../assets/login-fashion.jpg";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
    correo: z.string().email("Ingresa un correo válido."),
    password: z.string().min(6, "Mínimo 6 caracteres."),
});
type FormValues = z.infer<typeof schema>;

// ─── Componente ───────────────────────────────────────────────────────────────

export const LoginForm = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { correo: "", password: "" },
    });

    const onSubmit = async (values: FormValues) => {
        setError(null);
        setIsSubmitting(true);
        try {
            await login(values.correo, values.password);
            // Redirección según rol — el contexto ya tiene el user actualizado
            const token = localStorage.getItem("erp_token")!;
            const payload = JSON.parse(atob(token.split(".")[1]));
            const rol: string = payload.rol;
            navigate(rol === "CLIENTE" ? "/" : "/admin", { replace: true });
        } catch {
            setError("Correo o contraseña incorrectos.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* ── Panel izquierdo: formulario ── */}
            <div className="flex flex-col justify-center items-center w-full lg:w-1/2 bg-white px-8 py-12">
                <div className="w-full max-w-md space-y-8">

                    {/* Logo */}
                    <div className="flex flex-col items-center gap-2">
                        <img src={logoHori} alt="Logo" className="h-12 object-contain" />
                        <p className="text-sm text-slate-400 tracking-wide">Panel de Gestión</p>
                    </div>

                    {/* Encabezado */}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Bienvenido de vuelta</h1>
                        <p className="text-slate-500 text-sm mt-1">Ingresa tus credenciales para acceder al sistema.</p>
                    </div>

                    {/* Error global */}
                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Formulario */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

                        {/* Correo */}
                        <div className="space-y-1.5">
                            <label htmlFor="correo" className="block text-sm font-medium text-slate-700">
                                Correo electrónico
                            </label>
                            <input
                                id="correo"
                                type="email"
                                autoComplete="email"
                                placeholder="usuario@empresa.com"
                                {...register("correo")}
                                className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all
                                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                    ${errors.correo ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"}`}
                            />
                            {errors.correo && (
                                <p className="text-xs text-red-500">{errors.correo.message}</p>
                            )}
                        </div>

                        {/* Contraseña */}
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    {...register("password")}
                                    className={`w-full border rounded-lg px-3.5 py-2.5 pr-11 text-sm outline-none transition-all
                                        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                        ${errors.password ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Botón */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400
                                text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Ingresando...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-4 h-4" />
                                    Iniciar sesión
                                </>
                            )}
                        </button>
                    </form>

                    {/* Link a registro */}
                    <p className="text-center text-sm text-slate-500">
                        ¿No tienes cuenta?{" "}
                        <Link to="/register" className="text-indigo-600 font-medium hover:underline">
                            Regístrate aquí
                        </Link>
                    </p>

                </div>
            </div>

            {/* ── Panel derecho: imagen ── */}
            <div className="hidden lg:block w-1/2 relative p-3">
                <img
                    src={loginImage}
                    alt="Moda"
                    className="w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute inset-3 rounded-2xl bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10 text-white">
                    <p className="text-2xl font-bold leading-tight">Gestiona tu empresa<br />textil con eficiencia.</p>
                    <p className="text-white/70 text-sm mt-2">ERP + Ecommerce integrado.</p>
                </div>
            </div>
        </div>
    );
};
