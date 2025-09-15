import * as React from "react"
import { cn } from "../../lib/utils"
import { Input } from "../input"

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    const id = props.id || props.name

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        )}
        <Input
          className={cn(
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          id={id}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  }
)

AuthInput.displayName = "AuthInput"

export { AuthInput }