import * as React from "react";
import { cn } from "../lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps {
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  options: FormSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  testId?: string;
}

const FormSelect = React.forwardRef<
  React.ElementRef<typeof SelectTrigger>,
  FormSelectProps
>(({
  className,
  label,
  error,
  helperText,
  options,
  placeholder,
  testId,
  required,
  ...props
}, ref) => {
  const id = React.useId();
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
      <Select value={props.value} onValueChange={props.onValueChange}>
        <SelectTrigger
          ref={ref}
          id={id}
          data-testid={testId}
          className={cn(
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          disabled={props.disabled}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          aria-required={required}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
});

FormSelect.displayName = "FormSelect";

export { FormSelect };