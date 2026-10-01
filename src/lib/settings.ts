import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PaymentSettings = {
  bkash: { enabled: boolean; number: string; instructions: string };
  rocket: { enabled: boolean; number: string; instructions: string };
  bank: { enabled: boolean; bank_name: string; account_name: string; account_number: string; branch: string; instructions: string };
};
export type GeneralSettings = {
  site_name: string; phone: string; email: string; address: string;
  facebook: string; youtube: string; instagram: string; whatsapp: string;
};

export async function fetchSetting<T>(key: string): Promise<T | null> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as T) ?? null;
}

export function useSetting<T>(key: "payment" | "general") {
  return useQuery({ queryKey: ["setting", key], queryFn: () => fetchSetting<T>(key) });
}
