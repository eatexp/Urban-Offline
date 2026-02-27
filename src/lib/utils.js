import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx for conditional class handling.
 * shadcn/ui standard utility — used by all UI components.
 *
 * @example
 * cn("px-4 py-2", isActive && "bg-amber-500", className)
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
