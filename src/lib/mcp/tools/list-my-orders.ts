import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_orders",
  title: "List my orders",
  description: "List the signed-in user's orders with status and amount.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const { data, error } = await supabaseForUser(ctx)
      .from("orders")
      .select("id,status,amount,payment_method,created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new ToolError(error.message);
    const orders = (data ?? []).map((o) => ({
      id: String(o.id), status: String(o.status), amount: Number(o.amount),
      payment_method: String(o.payment_method), created_at: String(o.created_at),
    }));
    return { content: [{ type: "text", text: JSON.stringify(orders) }], structuredContent: { orders } };
  },
});
