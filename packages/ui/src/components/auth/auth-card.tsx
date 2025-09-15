import * as React from "react"
import { cn } from "../../lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../card"

export interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  glassmorphism?: boolean
}

const AuthCard = React.forwardRef<HTMLDivElement, AuthCardProps>(
  ({ className, title, description, glassmorphism = true, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "w-full max-w-md mx-auto",
          glassmorphism && [
            "backdrop-blur-sm bg-background/80",
            "border border-white/10",
            "shadow-2xl shadow-black/20",
          ],
          className
        )}
        {...props}
      >
        {(title || description) && (
          <CardHeader className="space-y-1">
            {title && (
              <CardTitle className="text-2xl font-semibold tracking-tight text-center">
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className="text-center">
                {description}
              </CardDescription>
            )}
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          {children}
        </CardContent>
      </Card>
    )
  }
)

AuthCard.displayName = "AuthCard"

export { AuthCard }