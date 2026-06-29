import { type ReactNode } from "react";

export function AdminPageHeader({
  eyebrow,
  title,
  actions,
}: {
  eyebrow?: string;
  title: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 mb-7">
      <div>
        {eyebrow && (
          <p
            className="text-base md:text-lg tracking-[0.3em] uppercase text-brand-primary/80"
            style={{ fontFamily: "var(--font-discovery)" }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className="mt-2 text-5xl md:text-6xl text-brand-primary-dark"
          style={{ fontFamily: "var(--font-bateran)" }}
        >
          {title}
        </h1>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        "rounded-2xl border border-brand-accent-soft/60 bg-brand-white/95 p-5 md:p-7 " +
        className
      }
      style={{ boxShadow: "0 20px 40px -34px rgba(82,16,20,0.30)" }}
    >
      {children}
    </section>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={
        "inline-flex items-center justify-center gap-2 rounded-full bg-brand-primary px-7 py-3.5 text-lg md:text-xl text-brand-white hover:bg-brand-primary-dark transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer " +
        className
      }
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={
        "inline-flex items-center justify-center gap-2 rounded-full border border-brand-primary/40 px-6 py-3 text-lg md:text-xl text-brand-primary hover:bg-brand-primary hover:text-brand-white transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer " +
        className
      }
    >
      {children}
    </button>
  );
}

export function DangerButton({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={
        "inline-flex items-center justify-center gap-2 rounded-full border border-brand-accent-alert/50 px-6 py-3 text-lg md:text-xl text-brand-accent-alert hover:bg-brand-accent-alert hover:text-brand-white transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer " +
        className
      }
    >
      {children}
    </button>
  );
}

export function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="block text-xl md:text-2xl font-medium text-brand-primary-dark mb-2.5"
        style={{ fontFamily: "var(--font-discovery)" }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-base md:text-lg text-brand-primary-dark/60 mt-2">
          {hint}
        </span>
      )}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-brand-accent-soft bg-brand-white px-5 py-3.5 text-lg md:text-xl text-brand-primary-dark outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15";
