import { Link } from "@tanstack/react-router";
import logo from "@/assets/neno-verse-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center", className)} aria-label="NENO-VERSE — হোম">
      <img
        src={logo.url}
        alt="NENO-VERSE — Digital Realms Unified"
        width={936}
        height={170}
        className="h-9 w-auto object-contain sm:h-10"
      />
    </Link>
  );
}
