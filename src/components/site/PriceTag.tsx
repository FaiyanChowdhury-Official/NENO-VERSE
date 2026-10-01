import { discountPercent, formatBdt, toBengaliDigits } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PriceTag({
  price,
  originalPrice,
  className,
  size = "md",
}: {
  price: number;
  originalPrice?: number;
  className?: string;
  size?: "md" | "lg";
}) {
  const off = discountPercent(price, originalPrice);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-bold text-foreground",
          size === "lg" ? "text-3xl" : "text-lg",
        )}
      >
        {formatBdt(price)}
      </span>
      {originalPrice ? (
        <span className="text-sm text-subtle-foreground line-through">
          {formatBdt(originalPrice)}
        </span>
      ) : null}
      {off ? (
        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-soft-foreground">
          {toBengaliDigits(off)}% ছাড়
        </span>
      ) : null}
    </div>
  );
}
