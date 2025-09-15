import * as React from "react";
import { cn } from "../lib/utils";

export interface FormMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "error" | "success" | "info";
}

const FormMessage = React.forwardRef<HTMLDivElement, FormMessageProps>(
  ({ className, type = "error", children, ...props }, ref) => {
    if (!children) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-md border px-3 py-2 text-sm",
          {
            "border-red-500/20 bg-red-500/10 text-red-500": type === "error",
            "border-green-500/20 bg-green-500/10 text-green-500":
              type === "success",
            "border-blue-500/20 bg-blue-500/10 text-blue-500": type === "info",
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

FormMessage.displayName = "FormMessage";

export { FormMessage };
