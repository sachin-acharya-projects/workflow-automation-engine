import { cn } from "@/lib/utils"

export const Select = ({ children, value, onValueChange, ...props }: any) => {
    return (
        <select
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            )}
            value={value}
            onChange={(e) => onValueChange?.(e.target.value)}
            {...props}
        >
            {children}
        </select>
    )
}

export const SelectTrigger = ({ children }: any) => <>{children}</>
export const SelectValue = ({ placeholder }: any) => <option value="" disabled hidden>{placeholder}</option>
export const SelectContent = ({ children }: any) => <>{children}</>
export const SelectItem = ({ value, children }: any) => <option value={value}>{children}</option>
