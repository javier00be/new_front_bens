import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

// ─── Tamaños ─────────────────────────────────────────────────────────────────
const sizeClass = {
    sm:   "sm:max-w-[420px]",
    md:   "sm:max-w-[580px]",
    lg:   "sm:max-w-[740px]",
    xl:   "sm:max-w-[920px]",
    "2xl":"sm:max-w-[1100px]",
};

// ─── Variantes de color del header ────────────────────────────────────────────
const variantHeader = {
    default: "text-slate-800",
    danger:  "text-rose-600",
    warning: "text-amber-600",
    success: "text-emerald-600",
};

// ─── Props ───────────────────────────────────────────────────────────────────
interface GenericModalProps {
    title: string;
    description?: string;
    /** Ícono que aparece junto al título */
    icon?: React.ReactNode;
    /** Colorea el título según el contexto */
    variant?: keyof typeof variantHeader;
    /** Elemento que abre el modal (opcional si se controla con isOpen) */
    trigger?: React.ReactNode;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Contenido del footer (botones, etc.) */
    footer?: React.ReactNode;
    size?: keyof typeof sizeClass;
    /** El cuerpo del modal tiene scroll interno */
    scrollable?: boolean;
    /** Altura máxima del área scrollable (default 65vh) */
    maxBodyHeight?: string;
    children: React.ReactNode;
}

export const GenericModal = ({
    title,
    description,
    icon,
    variant = "default",
    trigger,
    isOpen,
    onOpenChange,
    footer,
    size = "md",
    scrollable = false,
    maxBodyHeight = "65vh",
    children,
}: GenericModalProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className={`${sizeClass[size]} p-0 gap-0 overflow-hidden`}>

                {/* Header */}
                <DialogHeader className="px-6 py-5 border-b border-slate-100">
                    <DialogTitle className={`flex items-center gap-2 text-base font-semibold ${variantHeader[variant]}`}>
                        {icon && <span className="shrink-0">{icon}</span>}
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription className="text-sm text-slate-500 mt-0.5">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {/* Body */}
                <div
                    className={scrollable ? "overflow-y-auto" : undefined}
                    style={scrollable ? { maxHeight: maxBodyHeight } : undefined}
                >
                    <div className="px-6 py-5">{children}</div>
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60">
                        <DialogFooter>{footer}</DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
// Modal reutilizable para confirmar acciones destructivas o importantes.

interface ConfirmModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning" | "default";
    isLoading?: boolean;
    onConfirm: () => void;
}

const confirmVariantStyles = {
    danger:  "bg-rose-600 hover:bg-rose-700 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
    default: "bg-indigo-600 hover:bg-indigo-700 text-white",
};

const confirmIcons = {
    danger:  <AlertTriangle className="w-4 h-4 text-rose-600" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    default: null,
};

export const ConfirmModal = ({
    isOpen,
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = "danger",
    isLoading = false,
    onConfirm,
}: ConfirmModalProps) => {
    return (
        <GenericModal
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title={title}
            icon={confirmIcons[variant]}
            variant={variant}
            size="sm"
            footer={
                <div className="flex items-center justify-end gap-2 w-full">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        size="sm"
                        className={confirmVariantStyles[variant]}
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? "Procesando..." : confirmLabel}
                    </Button>
                </div>
            }
        >
            <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        </GenericModal>
    );
};
