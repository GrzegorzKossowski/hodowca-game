import { AVATARS } from '../animals'
import { theme } from '../theme'

interface Props {
  current: string
  onSelect: (avatar: string) => void
}

export function AvatarPicker({ current, onSelect }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 6,
        background: theme.color.bg,
        borderRadius: 12,
        padding: 10,
      }}
    >
      {AVATARS.map((av) => (
        <button
          key={av}
          onClick={() => onSelect(av)}
          style={{
            fontSize: 22,
            background: av === current ? theme.color.accentBg : theme.color.cardBg,
            border: `1.5px solid ${av === current ? theme.color.accent : theme.color.cardBorder}`,
            borderRadius: 8,
            height: 38,
            cursor: 'pointer',
          }}
        >
          {av}
        </button>
      ))}
    </div>
  )
}
