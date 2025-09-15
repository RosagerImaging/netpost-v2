import * as React from "react"
import { cn } from "../lib/utils"

export interface FormMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "error" | "success" | "info"
}

const FormMessage = React.forwardRef<HTMLDivElement, FormMessageProps>(
  ({ className, type = "error", children, ...props }, ref) => {
    if (!children) return null

    return (
      <div
        ref={ref}
        className={cn(
          "text-sm rounded-md px-3 py-2 border",
          {
            "text-red-500 bg-red-500/10 border-red-500/20": type === "error",
            "text-green-500 bg-green-500/10 border-green-500/20": type === "success",
            "text-blue-500 bg-blue-500/10 border-blue-500/20": type === "info",
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

FormMessage.displayName = "FormMessage"

export { FormMessage }