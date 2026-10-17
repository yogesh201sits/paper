import { PaperAvatar } from "@/components/paper-avatar"

type GroupAvatarBot = {
  name: string
  avatar: string
}

export function GroupAvatar({
  bots,
  className = "size-9",
}: {
  bots: GroupAvatarBot[]
  className?: string
}) {
  const visibleBots = bots.slice(0, 3)
  const positions = [
    "left-0 top-0",
    "left-[9px] top-[11px]",
    "left-[18px] top-0",
  ]

  return (
    <span
      aria-label={`Group with ${bots.map((bot) => bot.name).join(", ")}`}
      className={`relative inline-block shrink-0 ${className}`}
      role="img"
    >
      {visibleBots.map((bot, index) => (
        <PaperAvatar
          key={bot.avatar}
          seed={bot.avatar}
          alt=""
          size={22}
          className={`absolute size-[22px] rounded-full border-2 border-white ${positions[index]}`}
        />
      ))}
    </span>
  )
}
