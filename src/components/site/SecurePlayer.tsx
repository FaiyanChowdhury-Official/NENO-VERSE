import { useEffect, useRef, useState } from "react";
import { PlayCircle } from "lucide-react";

function embedUrl(url: string): { type: "iframe" | "video"; src: string } {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) return { type: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&modestbranding=1&iv_load_policy=3` };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { type: "iframe", src: `https://player.vimeo.com/video/${vm[1]}?dnt=1` };
  const gd = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (gd) return { type: "iframe", src: `https://drive.google.com/file/d/${gd[1]}/preview` };
  if (/\.(mp4|webm)(\?|$)/i.test(url)) return { type: "video", src: url };
  return { type: "iframe", src: url };
}

/**
 * Video player with download deterrents:
 * no download button, no right-click, no picture-in-picture, no drag,
 * and a moving watermark with the viewer's email to discourage screen recording.
 */
export function SecurePlayer({
  source,
  title,
  emptyText,
  onExpired,
}: {
  source: { kind: "file" | "external" | "none"; src: string; email: string } | null;
  title: string;
  emptyText: string;
  onExpired?: () => void;
}) {
  const [pos, setPos] = useState({ x: 10, y: 10 });
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const t = setInterval(() => setPos({ x: 5 + Math.random() * 60, y: 5 + Math.random() * 80 }), 6000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["s", "u"].includes(e.key.toLowerCase())) e.preventDefault();
    };
    window.addEventListener("keydown", block);
    return () => window.removeEventListener("keydown", block);
  }, []);

  if (!source || source.kind === "none") {
    return (
      <div className="flex size-full items-center justify-center text-background">
        <div className="text-center">
          <PlayCircle className="mx-auto size-14 opacity-80" />
          <p className="mt-3 text-sm opacity-80">{emptyText}</p>
        </div>
      </div>
    );
  }

  const media = source.kind === "file" ? { type: "video" as const, src: source.src } : embedUrl(source.src);

  return (
    <div className="relative size-full select-none" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()}>
      {media.type === "video" ? (
        <video
          ref={videoRef}
          key={media.src}
          src={media.src}
          controls
          controlsList="nodownload noplaybackrate noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          playsInline
          preload="metadata"
          className="size-full bg-foreground"
          onError={() => onExpired?.()}
        />
      ) : (
        <iframe key={media.src} src={media.src} title={title} className="size-full" allow="autoplay; fullscreen" allowFullScreen referrerPolicy="strict-origin" />
      )}
      {source.email && (
        <span
          className="pointer-events-none absolute text-xs font-semibold text-background/40 transition-all duration-1000"
          style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
        >
          {source.email}
        </span>
      )}
    </div>
  );
}
