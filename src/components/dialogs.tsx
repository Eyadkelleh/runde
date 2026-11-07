"use client";

import { useState } from "react";
import { REPORT_REASONS } from "@/domain/catalog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "cn";

export function NameDialog({
  open,
  idPrefix,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  idPrefix: string;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => string | null;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fieldId = `${idPrefix}-anzeigename`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anzeigename</DialogTitle>
          <DialogDescription>
            Den sehen andere nur an einem Treffen, dem du zusagst. Kein Konto, keine Prüfung.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const message = onSave(name);
            setError(message);
            if (!message) setName("");
          }}
        >
          <Label htmlFor={fieldId}>Name</Label>
          <Input
            id={fieldId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="nickname"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${fieldId}-error ${fieldId}-hint` : `${fieldId}-hint`}
          />
          <p id={`${fieldId}-hint`} className="text-sm text-muted-foreground">
            2 bis 24 Buchstaben. Bleibt auf diesem Gerät.
          </p>
          {error ? (
            <p id={`${fieldId}-error`} role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full">
            Name merken
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  destructive = false,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReportDialog({
  open,
  onOpenChange,
  onReport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReport: (reasonId: string) => void;
}) {
  const [reasonId, setReasonId] = useState<string>(REPORT_REASONS[0].id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Treffen melden</DialogTitle>
          <DialogDescription>
            Die Meldung bleibt auf diesem Gerät. Niemand prüft sie.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            onReport(reasonId);
            onOpenChange(false);
          }}
        >
          <fieldset>
            <legend className="text-sm font-medium">Grund</legend>
            <div className="mt-2 space-y-2">
              {REPORT_REASONS.map((reason) => (
                <label key={reason.id} className="flex min-h-11 items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="meldegrund"
                    value={reason.id}
                    checked={reasonId === reason.id}
                    onChange={() => setReasonId(reason.id)}
                  />
                  {reason.label}
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" className="w-full">
            Meldung speichern
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function choiceClass(selected: boolean, disabled = false): string {
  return cn(
    "flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-3 py-2 text-sm",
    selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
    disabled && "cursor-not-allowed opacity-50",
  );
}
