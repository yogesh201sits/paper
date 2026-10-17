
import { cn } from "@/lib/utils"

type PaperAvatarProps = {
  seed?: string
  alt?: string
  provider?: "robohash" | "dicebear"
  className?: string
}

export function PaperAvatar({
  seed = "Felix",
  alt = "Avatar",
  provider = "robohash",
  className,
}: PaperAvatarProps) {
  const src =
    provider === "dicebear"
      ? `https://api.dicebear.com/10.x/thumbs/svg?backgroundColor=ffe3ea,e3edff,e2f5e9,fdf1d4,efe6ff&shapeColor=ffffff&seed=${encodeURIComponent(seed)}`
      : `https://robohash.org/${encodeURIComponent(seed)}.png`

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn(
        "size-10 shrink-0 rounded-full border border-[#E7E7E7] bg-white object-cover",
        className
      )}
    />
  )
}
