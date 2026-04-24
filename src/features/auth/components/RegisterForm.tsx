import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logoHori from "@/assets/images/logos/logoHori.png";
import loginImage from "../assets/login-fashion.jpg";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z
    .object({
        nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
        apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres."),
        correo: z.string().email("Ingresa un correo válido."),
        telefono: z.string().optional(),
        password: z.string().min(6, "Mínimo 6 caracteres."),
        confirmarPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmarPassword, {
        message: "Las contraseñas no coinciden.",
        path: ["confirmarPassword"],
    });

type FormValues = z.infer<typeof schema>;

// ─── Campo reutilizable ───────────────────────────────────────────────────────

const Field = ({
    label,
    error,
    children,
    optional,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
    optional?: boolean;
}) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
            {label}
            {optional && <span className="ml-1 text-xs text-slate-400 font-normal">(opcional)</span>}
        </label>
        {children}
        {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
);

// ─── Componente ───────────────────────────────────────────────────────────────

export const RegisterForm = () => {
    const navigate = useNavigate();
    const { register: registerUser } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            nombre: "",
            apellido: "",
            correo: "",
            telefono: "",
            password: "",
            confirmarPassword: "",
        },
    });

    const password = watch("password");
    const passwordStrength = !password
        ? null
        : password.length < 6
        ? "débil"
        : password.length < 10
        ? "aceptable"
        : "fuerte";

    const strengthColor: Record<string, string> = {
        débil: "bg-red-400",
        aceptable: "bg-amber-400",
        fuerte: "bg-emerald-500",
    };

    const onSubmit = async (values: FormValues) => {
        setError(null);
        setIsSubmitting(true);
        try {
            await registerUser({
                nombre: values.nombre,
                apellido: values.apellido,
                correo: values.correo,
                password: values.password,
                telefono: values.telefono || undefined,
            });
            navigate("/", { replace: true });
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            if (typeof msg === "string" && msg.toLowerCase().includes("correo")) {
                setError("Este correo ya está registrado. Intenta iniciar sesión.");
            } else {
                setError("Ocurrió un error al crear la cuenta. Inténtalo de nuevo.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* ── Panel izquierdo: formulario ── */}
            <div className="flex flex-col justify-center items-center w-full lg:w-1/2 bg-white px-8 py-12">
                <div className="w-full max-w-md space-y-7">

                    {/* Logo */}
                    <div className="flex flex-col items-center gap-2">
                        <img src={logoHori} alt="Logo" className="h-12 object-contain" />
                        <p className="text-sm text-slate-400 tracking-wide">Crear cuenta</p>
                    </div>

                    {/* Encabezado */}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Crea tu cuenta</h1>
                        <p className="text-slate-500 text-sm mt-1">Únete a nuestra tienda y empieza a comprar.</p>
                    </div>

                    {/* Error global */}
                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Formulario */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

                        {/* Nombre + Apellido */}
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Nombre" error={errors.nombre?.message}>
                                <input
                                    type="text"
                                    autoComplete="given-name"
                                    placeholder="Juan"
                                    {...register("nombre")}
                                    className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all
                                        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                        ${errors.nombre ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                                />
                            </Field>
                            <Field label="Apellido" error={errors.apellido?.message}>
                                <input
                                    type="text"
                                    autoComplete="family-name"
                                    placeholder="Pérez"
                                    {...register("apellido")}
                                    className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all
                                        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                        ${errors.apellido ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                                />
                            </Field>
                        </div>

                        {/* Correo */}
                        <Field label="Correo electrónico" error={errors.correo?.message}>
                            <input
                                type="email"
                                autoComplete="email"
                                placeholder="juan@correo.com"
                                {...register("correo")}
                                className={`w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all
                                    focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                    ${errors.correo ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                            />
                        </Field>

                        {/* Teléfono */}
                        <Field label="Teléfono" error={errors.telefono?.message} optional>
                            <input
                                type="tel"
                                autoComplete="tel"
                                placeholder="999 999 999"
                                {...register("telefono")}
                                className="w-full border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </Field>

                        {/* Contraseña */}
                        <Field label="Contraseña" error={errors.password?.message}>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Mínimo 6 caracteres"
                                    {...register("password")}
                                    className={`w-full border rounded-lg px-3.5 py-2.5 pr-11 text-sm outline-none transition-all
                                        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                        ${errors.password ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {/* Barra de fuerza */}
                            {passwordStrength && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex gap-1">
                                        {["débil", "aceptable", "fuerte"].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1 flex-1 rounded-full transition-all ${
                                                    (passwordStrength === "débil" && level === "débil") ||
                                                    (passwordStrength === "aceptable" && (level === "débil" || level === "aceptable")) ||
                                                    passwordStrength === "fuerte"
                                                        ? strengthColor[passwordStrength]
                                                        : "bg-slate-200"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-400">Contraseña <span className="font-medium text-slate-600">{passwordStrength}</span></p>
                                </div>
                            )}
                        </Field>

                        {/* Confirmar contraseña */}
                        <Field label="Confirmar contraseña" error={errors.confirmarPassword?.message}>
                            <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    autoComplete="new-password"
                                    placeholder="Repite tu contraseña"
                                    {...register("confirmarPassword")}
                                    className={`w-full border rounded-lg px-3.5 py-2.5 pr-11 text-sm outline-none transition-all
                                        focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                                        ${errors.confirmarPassword ? "border-red-400 bg-red-50" : "border-slate-300"}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    tabIndex={-1}
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </Field>

                        {/* Términos */}
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Al registrarte aceptas nuestros{" "}
                            <span className="text-indigo-600 cursor-pointer hover:underline">Términos de servicio</span>{" "}
                            y{" "}
                            <span className="text-indigo-600 cursor-pointer hover:underline">Política de privacidad</span>.
                        </p>

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
                                    Creando cuenta...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    Crear cuenta
                                </>
                            )}
                        </button>
                    </form>

                    {/* Link a login */}
                    <p className="text-center text-sm text-slate-500">
                        ¿Ya tienes cuenta?{" "}
                        <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                            Inicia sesión
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
                <div className="absolute inset-3 rounded-2xl bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-10 left-10 text-white">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm">Envíos a todo el país</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm">Prendas de calidad premium</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm">Devoluciones sin complicaciones</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
