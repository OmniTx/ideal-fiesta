"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MenuItem } from "@/lib/types/database";

interface DeleteItemDialogProps {
  item: MenuItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (item: MenuItem) => Promise<boolean>;
}

export function DeleteItemDialog({
  item,
  onOpenChange,
  onConfirm,
}: DeleteItemDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const confirm = async () => {
    if (!item) return;
    setIsDeleting(true);
    const ok = await onConfirm(item);
    setIsDeleting(false);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={Boolean(item)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete item</DialogTitle>
          <DialogDescription>
            {item
              ? `“${item.name}” will be removed from the menu. This can’t be undone.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Keep item
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirm}
            disabled={isDeleting}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
