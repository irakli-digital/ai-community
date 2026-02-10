'use client';

function parseVideoUrl(url: string): { provider: string; id: string } | null {
  if (!url) return null;

  // YouTube
  const ytMatch =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/) ??
    url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { provider: 'youtube', id: ytMatch[1] };

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return { provider: 'vimeo', id: vimeoMatch[1] };

  return null;
}

export function VideoEmbed({ url }: { url: string }) {
  const parsed = parseVideoUrl(url);
  if (!parsed) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-secondary text-sm text-muted-foreground">
        Video unavailable
      </div>
    );
  }

  const embedUrl =
    parsed.provider === 'youtube'
      ? `https://www.youtube.com/embed/${parsed.id}?rel=0`
      : `https://player.vimeo.com/video/${parsed.id}`;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <iframe
        src={embedUrl}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Video"
      />
    </div>
  );
}
