"use client";

import { ReactNode } from "react";
import { AnimatedHeadline } from "./animated-headline";
import { cn } from "@netpost/ui";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-6 md:flex-row md:items-center md:justify-between", className)}>
      <div className="flex items-start gap-4">
        {icon ? (
          <div className="glass-card flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 text-2xl text-primary">
            {icon}
          </div>
        ) : null}
        <div className="space-y-3">
          {eyebrow ? (
            <span className="text-xs uppercase tracking-[0.35em] text-muted-foreground/80">
              {eyebrow}
            </span>
          ) : null}
          <AnimatedHeadline
            text={title}
            className="text-gradient-primary text-3xl font-semibold md:text-4xl"
          />
          {subtitle ? (
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">{actions}</div> : null}
    </div>
  );
}
