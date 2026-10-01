import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { adminDeleteItem, adminGetItem, adminListCategories, adminListItems, adminSaveItem, type AdminItemInput } from "@/lib/admin.functions";
import { formatBdt } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDelete, useAdminAction } from "./shared";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const accessLabels = { lessons: "ড্যাশবোর্ডে ভিডিও", link: "লিংকের মাধ্যমে", both: "ভিডিও + লিংক" } as const;

function blank(kind: "product" | "course"): AdminItemInput {
  return {
    kind,
    slug: "",
    name: "",
    category_slug: "",
    short_description: "",
    description: [],
    highlights: [],
    file_info: "",
    level: "beginner",
    instructor: "",
    duration: "",
    price: 0,
    original_price: null,
    image_url: "",
    popular: false,
    is_new: true,
    published: true,
    sort_order: 0,
    access_type: kind === "course" ? "lessons" : "link",
    access_note: "",
    access_days: null,
    link_url: "",
    link_label: "",
    lessons: [],
  };
}

export function ItemsPanel() {
  const list = useServerFn(adminListItems);
  const del = useServerFn(adminDeleteItem);
  const run = useAdminAction();
  const items = useQuery({ queryKey: ["admin-items"], queryFn: () => list() });
  const [kind, setKind] = useState<"product" | "course">("product");
  const [editing, setEditing] = useState<{ id?: string | undefined; kind: "product" | "course" } | null>(null);
  const rows = (items.data ?? []).filter((i) => i.kind === kind);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={kind === "product" ? "default" : "outline"} onClick={() => setKind("product")}>ডিজিটাল প্রোডাক্ট</Button>
        <Button size="sm" variant={kind === "course" ? "default" : "outline"} onClick={() => setKind("course")}>কোর্স</Button>
        <Button className="ml-auto" onClick={() => setEditing({ kind })}>
          <Plus className="size-4" /> নতুন {kind === "course" ? "কোর্স" : "প্রোডাক্ট"}
        </Button>
      </div>
      {items.isLoading ? (
        <p className="text-muted-foreground">লোড হচ্ছে...</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">কিছু নেই।</p>
      ) : (
        <div className="space-y-2">
          {rows.map((i) => (
            <div key={i.id} className="surface-card flex flex-wrap items-center gap-4 p-3">
              {i.image_url ? <img src={i.image_url} alt="" className="h-14 w-24 rounded-lg object-cover" /> : <div className="h-14 w-24 rounded-lg bg-muted" />}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{i.name}</p>
                <p className="text-xs text-subtle-foreground">
                  {formatBdt(i.price)}{i.original_price ? ` (আগে ${formatBdt(i.original_price)})` : ""} • অ্যাক্সেস: {accessLabels[i.access_type as keyof typeof accessLabels]} • {i.published ? "প্রকাশিত" : "লুকানো"}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditing({ id: i.id, kind: i.kind })}>এডিট</Button>
              <ConfirmDelete onConfirm={() => run(() => del({ data: { id: i.id } }), "মুছে ফেলা হয়েছে", [["admin-items"]])} />
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "এডিট করুন" : editing?.kind === "course" ? "নতুন কোর্স" : "নতুন প্রোডাক্ট"}</DialogTitle>
          </DialogHeader>
          {editing && <ItemEditor key={editing.id ?? "new"} id={editing.id} kind={editing.kind} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemEditor({ id, kind, onDone }: { id?: string | undefined; kind: "product" | "course"; onDone: () => void }) {
  const getItem = useServerFn(adminGetItem);
  const listCats = useServerFn(adminListCategories);
  const save = useServerFn(adminSaveItem);
  const run = useAdminAction();
  const cats = useQuery({ queryKey: ["admin-categories"], queryFn: () => listCats() });
  const loaded = useQuery({ queryKey: ["admin-item", id], queryFn: () => getItem({ data: { id: id! } }), enabled: !!id });
  const [v, setV] = useState<AdminItemInput | null>(id ? null : blank(kind));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loaded.data) setV(loaded.data);
  }, [loaded.data]);

  if (!v) return <p className="text-muted-foreground">লোড হচ্ছে...</p>;
  const set = <K extends keyof AdminItemInput>(k: K, val: AdminItemInput[K]) => setV({ ...v, [k]: val });
  const isCourse = v.kind === "course";
  const showLessons = v.access_type !== "link";
  const showLink = v.access_type !== "lessons";

  async function onSave() {
    if (!v) return;
    setBusy(true);
    const ok = await run(() => save({ data: v }), "সংরক্ষণ হয়েছে", [["admin-items"], ["admin-item", id ?? ""]]);
    setBusy(false);
    if (ok) onDone();
  }

  const lessons = v.lessons;
  const setLesson = (i: number, patch: Partial<AdminItemInput["lessons"][number]>) =>
    set("lessons", lessons.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const move = (i: number, d: number) => {
    const next = [...lessons];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x!);
    set("lessons", next);
  };

  return (
    <div className="space-y-6">
      <Section title="মূল তথ্য">
        <Field label="নাম"><Input value={v.name} onChange={(e) => set("name", e.target.value)} /></Field>
        <Field label="স্লাগ (লিংকে দেখাবে, ইংরেজি ছোট হাতের)">
          <Input value={v.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="my-product" />
        </Field>
        <Field label="ক্যাটাগরি">
          <select value={v.category_slug} onChange={(e) => set("category_slug", e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">— বেছে নিন —</option>
            {(cats.data ?? []).filter((c) => c.kind === v.kind).map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="ছবির লিংক (URL)"><Input value={v.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://..." /></Field>
        <Field label="ছোট বিবরণ" wide><Input value={v.short_description} onChange={(e) => set("short_description", e.target.value)} /></Field>
        <Field label="বিস্তারিত বিবরণ (প্রতি প্যারাগ্রাফ আলাদা লাইনে)" wide>
          <Textarea rows={4} value={v.description.join("\n")} onChange={(e) => set("description", e.target.value.split("\n"))} />
        </Field>
        <Field label={isCourse ? "যা শিখবেন (প্রতি লাইনে একটি)" : "যা থাকছে (প্রতি লাইনে একটি)"} wide>
          <Textarea rows={4} value={v.highlights.join("\n")} onChange={(e) => set("highlights", e.target.value.split("\n"))} />
        </Field>
        {isCourse ? (
          <>
            <Field label="ইন্সট্রাক্টর"><Input value={v.instructor} onChange={(e) => set("instructor", e.target.value)} /></Field>
            <Field label="মোট সময়"><Input value={v.duration} onChange={(e) => set("duration", e.target.value)} placeholder="৮ ঘণ্টা" /></Field>
            <Field label="লেভেল">
              <select value={v.level} onChange={(e) => set("level", e.target.value as AdminItemInput["level"])} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="beginner">প্রাথমিক</option>
                <option value="intermediate">মধ্যম</option>
                <option value="advanced">অ্যাডভান্সড</option>
              </select>
            </Field>
          </>
        ) : (
          <Field label="ফাইলের তথ্য"><Input value={v.file_info} onChange={(e) => set("file_info", e.target.value)} placeholder="PDF — ২৫ MB" /></Field>
        )}
      </Section>

      <Section title="দাম">
        <Field label="বিক্রয় মূল্য (৳)"><Input type="number" min={0} value={v.price} onChange={(e) => set("price", Math.max(0, Number(e.target.value)))} /></Field>
        <Field label="আগের দাম (৳) — ছাড় দেখাতে, না চাইলে খালি রাখুন">
          <Input type="number" min={0} value={v.original_price ?? ""} onChange={(e) => set("original_price", e.target.value ? Number(e.target.value) : null)} />
        </Field>
      </Section>

      <Section title="গ্রাহক কীভাবে অ্যাক্সেস পাবে">
        <Field label="অ্যাক্সেসের ধরন" wide>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(accessLabels) as (keyof typeof accessLabels)[]).map((k) => (
              <Button key={k} type="button" size="sm" variant={v.access_type === k ? "default" : "outline"} onClick={() => set("access_type", k)}>{accessLabels[k]}</Button>
            ))}
          </div>
        </Field>
        <Field label="অ্যাক্সেসের মেয়াদ (দিন) — খালি রাখলে আজীবন">
          <Input type="number" min={1} value={v.access_days ?? ""} onChange={(e) => set("access_days", e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="গ্রাহকের জন্য নির্দেশনা (ড্যাশবোর্ডে দেখাবে)" wide>
          <Textarea rows={2} value={v.access_note} onChange={(e) => set("access_note", e.target.value)} placeholder="যেমন: ফাইলটি ডাউনলোড করে আনজিপ করুন..." />
        </Field>
        {showLink && (
          <>
            <Field label="অ্যাক্সেস লিংক (শুধু ক্রেতারা দেখবে)">
              <Input value={v.link_url} onChange={(e) => set("link_url", e.target.value)} placeholder="Google Drive / Dropbox / যেকোনো লিংক" />
            </Field>
            <Field label="বোতামের লেখা"><Input value={v.link_label} onChange={(e) => set("link_label", e.target.value)} placeholder="ফাইল ডাউনলোড করুন" /></Field>
          </>
        )}
      </Section>

      {showLessons && (
        <section className="space-y-3">
          <h3 className="font-bold text-foreground">ভিডিও ক্লাস</h3>
          <p className="text-xs text-muted-foreground">সবচেয়ে নিরাপদ: ভিডিও ফাইল আপলোড করুন — এটি গোপন স্টোরেজে থাকে, শুধু ক্রেতারা ১০ মিনিট মেয়াদি লিংকে দেখতে পারে, ডাউনলোড বোতাম থাকে না। চাইলে YouTube (unlisted) বা Vimeo লিংকও দিতে পারেন।</p>
          {lessons.map((l, i) => (
            <div key={l.id ?? `new-${i}`} className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-[1fr_1fr_100px_auto]">
              <Input value={l.module_title} onChange={(e) => setLesson(i, { module_title: e.target.value })} placeholder="মডিউল/অধ্যায়" />
              <Input value={l.title} onChange={(e) => setLesson(i, { title: e.target.value })} placeholder="ক্লাসের নাম" />
              <Input value={l.duration} onChange={(e) => setLesson(i, { duration: e.target.value })} placeholder="১০:০০" />
              <div className="flex items-center gap-1">
                <Button type="button" size="icon" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="উপরে"><ArrowUp className="size-4" /></Button>
                <Button type="button" size="icon" variant="ghost" disabled={i === lessons.length - 1} onClick={() => move(i, 1)} aria-label="নিচে"><ArrowDown className="size-4" /></Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => set("lessons", lessons.filter((_, j) => j !== i))} aria-label="মুছুন"><Trash2 className="size-4 text-destructive" /></Button>
              </div>
              <div className="flex gap-2 sm:col-span-3">
                <Input value={l.video_url.startsWith("storage:") ? "🔒 আপলোড করা ভিডিও (সুরক্ষিত)" : l.video_url} readOnly={l.video_url.startsWith("storage:")} onChange={(e) => setLesson(i, { video_url: e.target.value })} placeholder="ভিডিও লিংক অথবা ফাইল আপলোড করুন" />
                <VideoUpload onUploaded={(path) => setLesson(i, { video_url: `storage:${path}` })} />
                {l.video_url && <Button type="button" size="sm" variant="ghost" className="h-10" onClick={() => setLesson(i, { video_url: "" })}>সরান</Button>}
              </div>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch checked={l.is_free} onCheckedChange={(c) => setLesson(i, { is_free: c })} /> ফ্রি প্রিভিউ
              </label>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => set("lessons", [...lessons, { module_title: lessons.at(-1)?.module_title ?? "", title: "", duration: "", is_free: false, video_url: "" }])}
          >
            <Plus className="size-4" /> ক্লাস যোগ করুন
          </Button>
        </section>
      )}

      <Section title="প্রদর্শন">
        <Toggle label="ওয়েবসাইটে প্রকাশিত" checked={v.published} onChange={(c) => set("published", c)} />
        <Toggle label="জনপ্রিয় ব্যাজ" checked={v.popular} onChange={(c) => set("popular", c)} />
        <Toggle label="নতুন ব্যাজ" checked={v.is_new} onChange={(c) => set("is_new", c)} />
        <Field label="ক্রম (ছোট সংখ্যা আগে দেখাবে)"><Input type="number" value={v.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} /></Field>
      </Section>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-background pt-4">
        <Button variant="ghost" onClick={onDone}>বাতিল</Button>
        <Button onClick={onSave} disabled={busy || !v.name || !v.slug}>{busy ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}</Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 font-bold text-foreground">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 text-sm text-foreground">
      <Switch checked={checked} onCheckedChange={onChange} /> {label}
    </label>
  );
}

function VideoUpload({ onUploaded }: { onUploaded: (path: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className={`inline-flex h-10 shrink-0 cursor-pointer items-center rounded-md border border-input px-3 text-sm font-medium ${busy ? "opacity-50" : "hover:bg-muted"}`}>
      {busy ? "আপলোড হচ্ছে..." : "ফাইল আপলোড"}
      <input
        type="file"
        accept="video/mp4,video/webm"
        className="hidden"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          const path = `${crypto.randomUUID()}.${file.name.split(".").pop() ?? "mp4"}`;
          const { error } = await supabase.storage.from("course-videos").upload(path, file, { contentType: file.type });
          setBusy(false);
          e.target.value = "";
          if (error) return void toast.error("আপলোড হয়নি: ফাইল খুব বড় হতে পারে");
          toast.success("ভিডিও আপলোড হয়েছে — সংরক্ষণ করতে ভুলবেন না");
          onUploaded(path);
        }}
      />
    </label>
  );
}
