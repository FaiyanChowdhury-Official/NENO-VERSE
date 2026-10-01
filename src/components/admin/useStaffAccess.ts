import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkIsAdmin } from "@/lib/admin.functions";

export function useStaffAccess() {
  const fn = useServerFn(checkIsAdmin);
  return useQuery({ queryKey: ["is-admin"], queryFn: () => fn() });
}
