import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCatalog from "./tools/list-catalog";
import listMyOrders from "./tools/list-my-orders";

const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "neno-verse",
  title: "NENO-VERSE",
  version: "0.1.0",
  instructions: "Tools for the NENO-VERSE course and digital product store. Use `list_catalog` to browse items and `list_my_orders` to see the signed-in user's orders.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listCatalog, listMyOrders],
});
