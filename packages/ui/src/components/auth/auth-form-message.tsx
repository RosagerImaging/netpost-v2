import * as React from "react"
import { cn } from "../../lib/utils"

export interface AuthFormMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "error" | "success" | "info"
}

const AuthFormMessage = React.forwardRef<HTMLDivElement, AuthFormMessageProps>(
  ({ className, type = "error", children, ...props }, ref) => {
    if (!children) return null

    return (
      <div
        ref={ref}
        className={cn(
          "text-sm rounded-md px-3 py-2",
          {
            "text-destructive bg-destructive/10 border border-destructive/20": type === "error",
            "text-green-600 bg-green-50 border border-green-200": type === "success",
            "text-blue-600 bg-blue-50 border border-blue-200": type === "info",
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

AuthFormMessage.displayName = "AuthFormMessage"

export { AuthFormMessage }