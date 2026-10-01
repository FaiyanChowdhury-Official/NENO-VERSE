import { Link } from "@tanstack/react-router";
import mark from "@/assets/octopus-mark.png";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)} aria-label="অক্টোপাস — হোম">
      <img
        src={mark}
        alt="অক্টোপাস লোগো"
        width={40}
        height={40}
        className="h-10 w-10 object-contain animate-float"
      />
      <span className="text-xl font-extrabold tracking-tight text-primary">
        অক্টোপাস
      </span>
    </Link>
  );
}
