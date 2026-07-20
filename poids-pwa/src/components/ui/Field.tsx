import type { ReactNode } from 'react'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-300">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-base text-slate-100 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 placeholder:text-slate-500'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className ?? ''}`} />
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100'
  const variants = {
    primary: 'bg-sky-400 text-slate-900 hover:bg-sky-300',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700',
    ghost: 'text-slate-300 hover:bg-slate-800',
  }
  return <button {...props} className={`${base} ${variants[variant]} ${className}`} />
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20 ${className}`}>
      {children}
    </div>
  )
}
