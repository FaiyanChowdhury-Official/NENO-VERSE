import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export const statusStyle = {
  pending: "bg-muted text-muted-foreground",
  approved: "bg-primary-soft text-primary-soft-foreground",
  rejected: "bg-destructive/10 text-destructive",
} as const;

export function ConfirmDelete({ onConfirm, label = "ডিলিট", children }: { onConfirm: () => Promise<unknown>; label?: string; children?: ReactNode }) {
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {children ?? <Button size="sm" variant="outline" className="text-destructive">{label}</Button>}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
          <AlertDialogDescription>এটি স্থায়ীভাবে মুছে যাবে, আর ফেরত আনা যাবে না।</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>বাতিল</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
              } finally {
                setBusy(false);
              }
            }}
          >
            হ্যাঁ, ডিলিট করুন
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Run an admin mutation with toast + cache refresh. */
export function useAdminAction() {
  const qc = useQueryClient();
  return async (fn: () => Promise<unknown>, success: string, keys: string[][] = []) => {
    try {
      await fn();
      toast.success(success);
      for (const k of keys) await qc.invalidateQueries({ queryKey: k });
      await qc.invalidateQueries({ queryKey: ["catalog"] });
      return true;
    } catch (e) {
      toast.error(e instanceof Error && e.message.length < 120 ? e.message : "কাজটি সম্পন্ন হয়নি");
      return false;
    }
  };
}
