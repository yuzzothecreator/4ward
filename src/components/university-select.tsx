"use client";

import { cn } from "@/lib/utils";
import {
  INSTITUTION_KINDS,
  TANZANIA_INSTITUTIONS,
  canonicalizeInstitution,
  institutionOptionLabel,
} from "@/lib/tanzania-institutions";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  /** Allow free-text “Other” */
  allowOther?: boolean;
  placeholder?: string;
};

export function UniversitySelect({
  id,
  value,
  onChange,
  className,
  required,
  disabled,
  allowOther = true,
  placeholder = "Select university / institute",
}: Props) {
  const canonical = canonicalizeInstitution(value);
  const known = TANZANIA_INSTITUTIONS.some((i) => i.short === canonical);
  const selectValue =
    !value?.trim()
      ? ""
      : known
        ? canonical
        : allowOther
          ? "__other__"
          : canonical;

  return (
    <div className="space-y-2">
      <select
        id={id}
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground",
          className
        )}
        value={selectValue}
        disabled={disabled}
        required={required && selectValue !== "__other__"}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__other__") {
            onChange(value && !known ? value : "");
            return;
          }
          onChange(v);
        }}
      >
        <option value="">{placeholder}</option>
        {INSTITUTION_KINDS.map((group) => (
          <optgroup key={group.id} label={group.label}>
            {TANZANIA_INSTITUTIONS.filter((i) => i.kind === group.id).map(
              (inst) => (
                <option key={inst.short} value={inst.short}>
                  {institutionOptionLabel(inst)}
                </option>
              )
            )}
          </optgroup>
        ))}
        {allowOther ? <option value="__other__">Other (type below)</option> : null}
      </select>
      {allowOther && selectValue === "__other__" ? (
        <input
          className="flex h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          value={known ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your institution name"
          required={required}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}
