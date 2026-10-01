import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PaymentSettings = {
  bkash: { enabled: boolean; number: string; instructions: string };
  rocket: { enabled: boolean; number: string; instructions: string };
  nagad: { enabled: boolean; number: string; instructions: string };
  bank: { enabled: boolean; bank_name: string; account_name: string; account_number: string; branch: string; instructions: string };
};
export const defaultNagad = { enabled: false, number: "", instructions: "নগদ অ্যাপ বা *167# থেকে \"সেন্ড মানি\" অপশনে যান\nউপরের নম্বরে মোট টাকা পাঠান\nট্রানজেকশন আইডি নিচে লিখুন" };
export type GeneralSettings = {
  site_name: string; phone: string; email: string; address: string;
  facebook: string; youtube: string; instagram: string; whatsapp: string;
  telegram?: string; messenger?: string;
};

export async function fetchSetting<T>(key: string): Promise<T | null> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as T) ?? null;
}

export function useSetting<T>(key: "payment" | "general" | "staff_access") {
  return useQuery({ queryKey: ["setting", key], queryFn: () => fetchSetting<T>(key) });
}

export type StorefrontSettings = {
  announcement: string; badge: string; title: string; highlight: string; subtitle: string;
  stat1_label: string; stat1_value: string; stat2_label: string; stat2_value: string; stat3_label: string; stat3_value: string;
  show_products: boolean; show_courses: boolean; show_stories: boolean;
};
export const defaultStorefront: StorefrontSettings = {
  announcement: "",
  badge: "বাংলাদেশের ডিজিটাল মার্কেটপ্লেস",
  title: "আপনার {highlight} ও কোর্স এখন এক জায়গায়।",
  highlight: "ডিজিটাল প্রোডাক্ট",
  subtitle: "প্রয়োজনীয় ডিজিটাল প্রোডাক্ট ও অনলাইন কোর্স সহজে খুঁজুন, কিনুন এবং পেমেন্ট সম্পন্ন হওয়ার পর সরাসরি অ্যাক্সেস নিন।",
  stat1_label: "প্রোডাক্ট", stat1_value: "১২০+", stat2_label: "কোর্স", stat2_value: "৪৫+", stat3_label: "শিক্ষার্থী", stat3_value: "৮,০০০+",
  show_products: true, show_courses: true, show_stories: true,
};
