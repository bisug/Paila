import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageFrameProps = {
  children: ReactNode;
  className?: string;
};

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

type SectionHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

type SurfaceProps = {
  children: ReactNode;
  className?: string;
  tone?: "default" | "subtle" | "brand";
};

export function PageFrame({ children, className }: PageFrameProps) {
  return <div className={cn("px-4 py-6 md:px-8", className)}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0 flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-terracotta">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Surface({ children, className, tone = "default" }: SurfaceProps) {
  const toneClass = {
    default: "border-border bg-card shadow-card text-card-foreground",
    subtle: "border-border bg-muted/40 text-foreground",
    brand: "border-terracotta/20 bg-terracotta/5 text-foreground",
  }[tone];

  return <div className={cn("rounded-card border p-4", toneClass, className)}>{children}</div>;
}
