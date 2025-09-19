import * as React from "react";
import { cn } from "../lib/utils";
import { Input } from "./input";

export interface FormFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ className, label, error, helperText, required, ...props }, ref) => {
    const id = props.id || props.name || `field-${React.useId()}`;
    const errorId = error ? `${id}-error` : undefined;
    const helperTextId = helperText ? `${id}-helper` : undefined;
    const describedBy = [errorId, helperTextId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={id}
            className="text-primary-text text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        <Input
          className={cn(
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          id={id}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          aria-required={required}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperTextId} className="text-secondary-text/70 text-sm">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export { FormField };