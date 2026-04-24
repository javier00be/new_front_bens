import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, FileText, Hash, DollarSign, Tag } from "lucide-react";
import { useItems } from "../hooks/useItems";
import type { CreateItemDto } from "../types/items.type";
import { sileo } from "sileo";

const itemSchema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    descripcion: z.string().optional(),
    cantidad: z.number().min(1, "La cantidad debe ser al menos 1"),
    precio: z.number().min(0.01, "El precio debe ser mayor a 0"),
    unidad: z.string().min(1, "La unidad es requerida"),
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface AddItemFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export const AddItemForm = ({ onSuccess, onCancel }: AddItemFormProps) => {
    const { addItem } = useItems();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ItemFormValues>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            nombre: "",
            descripcion: "",
            cantidad: 1,
            precio: 0,
            unidad: "unidad",
        }
    });

    const onSubmit = async (data: ItemFormValues) => {
        setIsSubmitting(true);
        try {
            const result = await addItem(data as CreateItemDto);
            if (result) {
                sileo.success({ title: "Éxito", description: "Artículo creado exitosamente" });
                onSuccess();
            } else {
                sileo.error({ title: "Error", description: "Error al crear el artículo" });
            }
        } catch (error) {
            sileo.error({ title: "Error", description: "Ocurrió un error inesperado" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form id="add-item-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Artículo</Label>
                <div className="relative">
                    <Package className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        id="nombre"
                        placeholder="Ej. Laptop Dell XPS"
                        className="pl-10"
                        {...register("nombre")}
                    />
                </div>
                {errors.nombre && <p className="text-xs text-red-500 font-medium">{errors.nombre.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <div className="relative">
                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        id="descripcion"
                        placeholder="Descripción detallada del artículo"
                        className="pl-10"
                        {...register("descripcion")}
                    />
                </div>
                {errors.descripcion && <p className="text-xs text-red-500 font-medium">{errors.descripcion.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="cantidad">Cantidad</Label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            id="cantidad"
                            type="number"
                            placeholder="0"
                            className="pl-10"
                            {...register("cantidad", { valueAsNumber: true })}
                        />
                    </div>
                    {errors.cantidad && <p className="text-xs text-red-500 font-medium">{errors.cantidad.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="precio">Precio</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            id="precio"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-10"
                            {...register("precio", { valueAsNumber: true })}
                        />
                    </div>
                    {errors.precio && <p className="text-xs text-red-500 font-medium">{errors.precio.message}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="unidad">Unidad de Medida</Label>
                <div className="relative">
                    <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        id="unidad"
                        placeholder="Ej. unidad, kg, litro"
                        className="pl-10"
                        {...register("unidad")}
                    />
                </div>
                {errors.unidad && <p className="text-xs text-red-500 font-medium">{errors.unidad.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar Artículo"}
                </Button>
            </div>
        </form>
    );
};
