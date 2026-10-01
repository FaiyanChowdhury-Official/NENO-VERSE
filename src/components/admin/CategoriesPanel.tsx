import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { adminDeleteCategory, adminListCategories, adminSaveCategory } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDelete, useAdminAction } from "./shared";

type Cat = { id: string; kind: "product" | "course"; slug: string; name: string; sort_order: number };

export function CategoriesPanel() {
  const list = useServerFn(adminListCategories);
  const del = useServerFn(adminDeleteCategory);
  const run = useAdminAction();
  const cats = useQuery({ queryKey: ["admin-categories"], queryFn: () => list() });
  const [editing, setEditing] = useState<Cat | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {(["product", "course"] as const).map((kind) => (
        <div key={kind} className="surface-card p-5">
          <h3 className="font-bold text-foreground">{kind === "product" ? "প্রোডাক্ট ক্যাটাগরি" : "কোর্স ক্যাটাগরি"}</h3>
          <div className="mt-4 space-y-2">
            {(cats.data ?? []).filter((c) => c.kind === kind).map((c) =>
              editing?.id === c.id ? (
                <CategoryForm key={c.id} kind={kind} initial={c} onDone={() => setEditing(null)} />
              ) : (
                <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-subtle-foreground">{c.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(c)}>এডিট</Button>
                    <ConfirmDelete onConfirm={() => run(() => del({ data: { id: c.id } }), "ক্যাটাগরি মুছে ফেলা হয়েছে", [["admin-categories"]])} />
                  </div>
                </div>
              ),
            )}
          </div>
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-2 text-sm font-semibold text-foreground">নতুন ক্যাটাগরি</p>
            <CategoryForm kind={kind} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoryForm({ kind, initial, onDone }: { kind: "product" | "course"; initial?: Cat; onDone?: () => void }) {
  const save = useServerFn(adminSaveCategory);
  const run = useAdminAction();
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const ok = await run(
      () =>
        save({
          data: {
            ...(initial && { id: initial.id }),
            kind,
            name: String(f.get("name")),
            slug: String(f.get("slug")).toLowerCase(),
            sort_order: Number(f.get("sort") || 0),
          },
        }),
      "সংরক্ষণ হয়েছে",
      [["admin-categories"]],
    );
    if (ok) {
      if (!initial) (e.target as HTMLFormElement).reset();
      onDone?.();
    }
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap gap-2">
      <Input name="name" placeholder="নাম (যেমন: ই-বুক)" defaultValue={initial?.name} required className="min-w-32 flex-1" />
      <Input name="slug" placeholder="slug (ebook)" defaultValue={initial?.slug} required pattern="[a-z0-9-]+" className="w-32" />
      <Input name="sort" type="number" placeholder="ক্রম" defaultValue={initial?.sort_order ?? 0} className="w-20" />
      <Button type="submit" size="sm" className="h-10">{initial ? "সংরক্ষণ" : "যোগ করুন"}</Button>
      {onDone && <Button type="button" size="sm" variant="ghost" className="h-10" onClick={onDone}>বাতিল</Button>}
    </form>
  );
}
