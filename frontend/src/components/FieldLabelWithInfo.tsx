import { Info } from "lucide-react";

type FieldLabelWithInfoProps = {
  /** Optional `for` attribute when the label is associated with a control `id`. */
  htmlFor?: string;
  /** Shown on hover/focus of the info icon (native `title` tooltip). */
  hint: string;
  children: React.ReactNode;
};

/**
 * Field label with an explicit info (ⓘ) icon so help is discoverable without hovering the text.
 */
export function FieldLabelWithInfo({ htmlFor, hint, children }: FieldLabelWithInfoProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="label mb-1.5 flex w-full flex-wrap items-center gap-1.5 text-left"
    >
      <span className="min-w-0 flex-1 leading-tight">{children}</span>
      <span
        className="inline-flex shrink-0 cursor-help rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45"
        title={hint}
        tabIndex={0}
        aria-label={hint}
      >
        <Info className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
    </label>
  );
}
