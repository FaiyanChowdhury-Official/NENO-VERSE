import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_catalog",
  title: "List catalog",
  description: "List published NENO-VERSE courses and digital products with prices.",
  inputSchema: {
    kind: z.enum(["course", "product"]).optional().describe("Filter by course or product."),
    search: z.string().max(100).optional().describe("Text to match in the name."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ kind, search }, ctx) => {
    let q = supabaseForUser(ctx)
      .from("items")
      .select("slug,kind,name,short_description,price,original_price")
      .eq("published", true)
      .limit(100);
    if (kind) q = q.eq("kind", kind);
    if (search) q = q.ilike("name", `%${search}%`);
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const items = (data ?? []).map((i) => ({
      slug: String(i.slug), kind: String(i.kind), name: String(i.name),
      description: String(i.short_description ?? ""), price: Number(i.price),
      original_price: i.original_price == null ? null : Number(i.original_price),
    }));
    return { content: [{ type: "text", text: JSON.stringify(items) }], structuredContent: { items } };
  },
});
