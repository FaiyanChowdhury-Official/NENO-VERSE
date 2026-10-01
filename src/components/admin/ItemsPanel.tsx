import { generateItemDescription, type GeneratedDescription } from "@/lib/review-insights.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Loader2, Wand2 } from "lucide-react";
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
    requires_customer_info: false,
    customer_info_label: "",
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
  const setMany = (patch: Partial<AdminItemInput>) => setV({ ...v, ...patch });
  const isCourse = v.kind === "course";
  const showLessons = v.access_type !== "link";
  const showLink = v.access_type !== "lessons";

  async function onSave(patch: Partial<AdminItemInput> = {}) {
    if (!v) return;
    setBusy(true);
    const data = { ...v, ...patch };
    const ok = await run(() => save({ data }), data.published ? "প্রকাশিত হয়েছে" : "খসড়া সংরক্ষণ হয়েছে", [["admin-items"], ["admin-item", id ?? ""]]);
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

  const steps = [
    { t: "মূল তথ্য", done: !!(v.name && v.slug && v.category_slug) },
    { t: "দাম", done: v.price > 0 },
    ...(showLessons ? [{ t: isCourse ? "মডিউল ও ভিডিও" : "কনটেন্ট", done: lessons.length > 0 && lessons.every((l) => l.title && l.video_url) }] : []),
    ...(showLink ? [{ t: "অ্যাক্সেস লিংক", done: !!v.link_url }] : []),
    { t: "প্রকাশ", done: v.published },
  ];
  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2 rounded-xl bg-muted/60 p-3 text-xs">
        {steps.map((s, i) => (
          <li key={s.t} className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${s.done ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground"}`}>
            <span>{s.done ? "✓" : (i + 1).toLocaleString("bn-BD")}</span>{s.t}
          </li>
        ))}
      </ol>
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
        <Field label="থাম্বনেইল (১৬:৯ ছবি, সর্বোচ্চ ৫MB)">
          <ThumbnailUpload value={v.image_url} onChange={(url) => set("image_url", url)} />
        </Field>
        <AiDescribe name={v.name} duration={v.access_days ? `${v.access_days} দিন` : ""} highlights={v.highlights}
          onResult={(r) => setMany({ short_description: r.short_description, description: r.description, highlights: r.highlights })} />
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
        <Field label="চেকআউটে গ্রাহকের তথ্য চাইবেন? (যেমন সাবস্ক্রিপশন চালুর ইমেইল)">
          <div className="flex items-center gap-3">
            <input type="checkbox" className="h-4 w-4" checked={v.requires_customer_info} onChange={(e) => set("requires_customer_info", e.target.checked)} />
            <Input value={v.customer_info_label} disabled={!v.requires_customer_info} onChange={(e) => set("customer_info_label", e.target.value)} placeholder="যেমন: যে ইমেইলে Canva Pro চালু করতে চান" />
          </div>
        </Field>
        <Field label="গ্রাহকের জন্য নির্দেশনা (ড্যাশবোর্ডে দেখাবে)" wide>
          <Textarea rows={2} value={v.access_note} onChange={(e) => set("access_note", e.target.value)} placeholder="যেমন: ফাইলটি ডাউনলোড করে আনজিপ করুন..." />
        </Field>
        {showLink && (
          <>
            <Field label="অ্যাক্সেস ফাইল বা লিংক (সবচেয়ে নিরাপদ: ফাইল আপলোড)">
              <div className="flex gap-2">
                <Input value={v.link_url} onChange={(e) => set("link_url", e.target.value)} placeholder="ফাইল আপলোড করুন বা লিংক দিন" />
                <VideoUpload bucket="product-files" accept="*/*" onUploaded={(path) => set("link_url", `storage:${path}`)} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">আপলোড করা ফাইল গোপন থাকে; ক্রেতা শুধু ওয়েবসাইটের ভেতরে ২ মিনিটের লিংকে দেখতে পায়। বাইরের লিংক শেয়ার হয়ে যেতে পারে।</p>
            </Field>
            <Field label="বোতামের লেখা"><Input value={v.link_label} onChange={(e) => set("link_label", e.target.value)} placeholder="ফাইল ডাউনলোড করুন" /></Field>
          </>
        )}
      </Section>

      {showLessons && (
        <section className="space-y-3">
          <h3 className="font-bold text-foreground">কোর্স কারিকুলাম (মডিউল ও ক্লাস)</h3>
          <p className="text-xs text-muted-foreground">সবচেয়ে নিরাপদ: ভিডিও ফাইল আপলোড করুন — এটি গোপন স্টোরেজে থাকে, শুধু ক্রেতারা ৫ মিনিট মেয়াদি লিংকে দেখতে পারে, ডাউনলোড বোতাম থাকে না। জায়গা বাঁচাতে YouTube-এ ভিডিওটি "Unlisted" করে আপলোড দিন, তারপর তার লিংক বা iframe (Embed) কোড এখানে বসান — ভিডিও কোর্সের ভেতরেই চলবে।</p>
          {moduleGroups(lessons).map((g, gi) => (
            <div key={gi} className="space-y-2 rounded-2xl border border-border bg-muted/30 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="shrink-0 rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">মডিউল {(gi + 1).toLocaleString("bn-BD")}</span>
                <Input className="font-semibold" value={g.title} placeholder="মডিউলের নাম, যেমন: শুরু করার আগে"
                  onChange={(e) => set("lessons", lessons.map((l, j) => (j >= g.start && j < g.start + g.items.length ? { ...l, module_title: e.target.value } : l)))} />
                <span className="shrink-0 text-xs text-muted-foreground">{g.items.length.toLocaleString("bn-BD")}টি ক্লাস</span>
                <Button type="button" size="sm" variant="ghost" onClick={() => { if (confirm("পুরো মডিউল ও এর সব ক্লাস মুছবেন?")) set("lessons", lessons.filter((_, j) => j < g.start || j >= g.start + g.items.length)); }}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
              {g.items.map((l, k) => {
                const i = g.start + k;
                return (
                  <div key={l.id ?? `new-${i}`} className="grid gap-2 rounded-xl border border-border bg-background p-3 sm:grid-cols-[1fr_100px_auto]">
                    <Input value={l.title} onChange={(e) => setLesson(i, { title: e.target.value })} placeholder={`ক্লাস ${(k + 1).toLocaleString("bn-BD")}-এর নাম`} />
                    <Input value={l.duration} onChange={(e) => setLesson(i, { duration: e.target.value })} placeholder="১০:০০" />
                    <div className="flex items-center gap-1">
                      <Button type="button" size="icon" variant="ghost" disabled={k === 0} onClick={() => move(i, -1)} aria-label="উপরে"><ArrowUp className="size-4" /></Button>
                      <Button type="button" size="icon" variant="ghost" disabled={k === g.items.length - 1} onClick={() => move(i, 1)} aria-label="নিচে"><ArrowDown className="size-4" /></Button>
                      <Button type="button" size="icon" variant="ghost" onClick={() => set("lessons", lessons.filter((_, j) => j !== i))} aria-label="মুছুন"><Trash2 className="size-4 text-destructive" /></Button>
                    </div>
                    <div className="flex gap-2 sm:col-span-3">
                      <Input value={l.video_url.startsWith("storage:") ? "আপলোড করা ভিডিও (সুরক্ষিত)" : l.video_url} readOnly={l.video_url.startsWith("storage:")} onChange={(e) => setLesson(i, { video_url: e.target.value })} placeholder="YouTube/Vimeo লিংক বা iframe কোড দিন, অথবা ফাইল আপলোড করুন" />
                      <VideoUpload onUploaded={(path) => setLesson(i, { video_url: `storage:${path}` })} />
                      {l.video_url && <Button type="button" size="sm" variant="ghost" className="h-10" onClick={() => setLesson(i, { video_url: "" })}>সরান</Button>}
                    </div>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Switch checked={l.is_free} onCheckedChange={(c) => setLesson(i, { is_free: c })} /> ফ্রি প্রিভিউ
                    </label>
                  </div>
                );
              })}
              <Button type="button" size="sm" variant="outline"
                onClick={() => { const at = g.start + g.items.length; const next = [...lessons]; next.splice(at, 0, { module_title: g.title, title: "", duration: "", is_free: false, video_url: "" }); set("lessons", next); }}>
                <Plus className="size-4" /> এই মডিউলে ক্লাস যোগ করুন
              </Button>
            </div>
          ))}
          <Button type="button" onClick={() => set("lessons", [...lessons, { module_title: `নতুন মডিউল ${(moduleGroups(lessons).length + 1).toLocaleString("bn-BD")}`, title: "", duration: "", is_free: false, video_url: "" }])}>
            <Plus className="size-4" /> নতুন মডিউল যোগ করুন
          </Button>
        </section>
      )}

      <Section title="প্রদর্শন">
        <Toggle label="ওয়েবসাইটে প্রকাশিত" checked={v.published} onChange={(c) => set("published", c)} />
        <Toggle label="জনপ্রিয় ব্যাজ" checked={v.popular} onChange={(c) => set("popular", c)} />
        <Toggle label="নতুন ব্যাজ" checked={v.is_new} onChange={(c) => set("is_new", c)} />
        <Field label="ক্রম (ছোট সংখ্যা আগে দেখাবে)"><Input type="number" value={v.sort_order} onChange={(e) => set("sort_order", Number(e.target.value))} /></Field>
      </Section>

      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-border bg-background pt-4">
        <Button variant="ghost" onClick={onDone}>বাতিল</Button>
        <Button variant="outline" onClick={() => onSave({ published: false })} disabled={busy || !v.name || !v.slug}>খসড়া হিসেবে রাখুন</Button>
        <Button onClick={() => onSave({ published: true })} disabled={busy || !v.name || !v.slug}>{busy ? "সংরক্ষণ হচ্ছে..." : "প্রকাশ করুন"}</Button>
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

function VideoUpload({ onUploaded, bucket = "course-videos", accept = "video/mp4,video/webm" }: { onUploaded: (path: string) => void; bucket?: string; accept?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className={`inline-flex h-10 shrink-0 cursor-pointer items-center rounded-md border border-input px-3 text-sm font-medium ${busy ? "opacity-50" : "hover:bg-muted"}`}>
      {busy ? "আপলোড হচ্ছে..." : "ফাইল আপলোড"}
      <input
        type="file"
        accept={accept}
        className="hidden"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          const path = `${crypto.randomUUID()}.${(file.name.split(".").pop() ?? "bin").toLowerCase()}`;
          const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
          setBusy(false);
          e.target.value = "";
          if (error) return void toast.error("আপলোড হয়নি: ফাইল খুব বড় হতে পারে");
          toast.success("আপলোড হয়েছে — সংরক্ষণ করতে ভুলবেন না");
          onUploaded(path);
        }}
      />
    </label>
  );
}

function AiDescribe({ name, duration, highlights, onResult }: { name: string; duration: string; highlights: string[]; onResult: (r: GeneratedDescription) => void }) {
  const gen = useServerFn(generateItemDescription);
  const [benefits, setBenefits] = useState(highlights.filter(Boolean).join(", "));
  const [dur, setDur] = useState(duration);
  const [busy, setBusy] = useState(false);
  async function go() {
    if (name.trim().length < 2) { toast.error("আগে নাম লিখুন"); return; }
    setBusy(true);
    try {
      const r = await gen({ data: { name, benefits, duration: dur } });
      if (r.ok) { onResult(r.result); toast.success("বিবরণ তৈরি হয়েছে — দেখে সংরক্ষণ করুন"); } else toast.error(r.error);
    } catch { toast.error("বিবরণ তৈরি ব্যর্থ হয়েছে"); }
    finally { setBusy(false); }
  }
  return (
    <div className="space-y-2 rounded-xl border border-border bg-primary-soft/40 p-3 sm:col-span-2">
      <p className="text-sm font-bold text-foreground">AI দিয়ে বাংলা বিবরণ লিখুন</p>
      <div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
        <Input value={benefits} onChange={(e) => setBenefits(e.target.value)} placeholder="সুবিধা (কমা দিয়ে আলাদা করুন)" maxLength={2000} />
        <Input value={dur} onChange={(e) => setDur(e.target.value)} placeholder="মেয়াদ, যেমন ১ মাস" maxLength={100} />
        <Button type="button" onClick={go} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} তৈরি করুন</Button>
      </div>
    </div>
  );
}

/** Groups consecutive lessons sharing the same module title. */
function moduleGroups<T extends { module_title: string }>(lessons: T[]) {
  const groups: { title: string; start: number; items: T[] }[] = [];
  lessons.forEach((l, i) => {
    const last = groups.at(-1);
    if (last && last.title === l.module_title) last.items.push(l);
    else groups.push({ title: l.module_title, start: i, items: [l] });
  });
  return groups;
}

function ThumbnailUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-2">
      <div className="relative aspect-video w-full max-w-xs overflow-hidden rounded-xl border border-dashed border-border bg-muted">
        {value ? <img src={value} alt="থাম্বনেইল" className="h-full w-full object-cover" /> : <p className="flex h-full items-center justify-center text-xs text-muted-foreground">কোনো ছবি নেই</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className={`inline-flex h-9 cursor-pointer items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground ${busy ? "opacity-50" : ""}`}>
          {busy ? "আপলোড হচ্ছে..." : value ? "ছবি বদলান" : "ছবি আপলোড"}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={busy}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) { toast.error("ছবি ৫MB-এর কম হতে হবে"); return; }
              setBusy(true);
              const path = `${crypto.randomUUID()}.${(file.name.split(".").pop() ?? "jpg").toLowerCase()}`;
              const up = await supabase.storage.from("thumbnails").upload(path, file, { contentType: file.type });
              const signed = up.error ? null : await supabase.storage.from("thumbnails").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
              setBusy(false);
              if (!signed?.data) { toast.error("আপলোড হয়নি"); return; }
              onChange(signed.data.signedUrl);
              toast.success("ছবি আপলোড হয়েছে — সংরক্ষণ করতে ভুলবেন না");
            }} />
        </label>
        {value && <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>সরান</Button>}
      </div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="অথবা ছবির লিংক দিন" className="h-9 text-xs" />
    </div>
  );
}
