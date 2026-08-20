import { theme } from './ui/theme'
import { useGameStore } from './ui/store'
import { useIsDesktop } from './ui/hooks/useIsDesktop'
import { useBotTurn } from './ui/hooks/useBotTurn'
import { useTurnTimer } from './ui/hooks/useTurnTimer'
import { ModeScreen } from './ui/screens/ModeScreen'
import { OnlineChoiceScreen } from './ui/screens/OnlineChoiceScreen'
import { JoinScreen } from './ui/screens/JoinScreen'
import { LobbyScreen } from './ui/screens/LobbyScreen'
import { BoardScreen } from './ui/screens/BoardScreen'
import { PassScreen } from './ui/screens/PassScreen'
import { WinScreen } from './ui/screens/WinScreen'
import { RulesModal } from './ui/components/RulesModal'
import { AppHelpModal } from './ui/components/AppHelpModal'
import { EventOverlay } from './ui/components/EventOverlay'
import { Toast } from './ui/components/Toast'
import { TurnChangeAnnouncement } from './ui/components/TurnChangeAnnouncement'

function CurrentScreen() {
  const screen = useGameStore((s) => s.screen)
  switch (screen) {
    case 'mode':
      return <ModeScreen />
    case 'online-choice':
      return <OnlineChoiceScreen />
    case 'join':
      return <JoinScreen />
    case 'lobby':
      return <LobbyScreen />
    case 'board':
      return <BoardScreen />
    case 'pass':
      return <PassScreen />
    case 'win':
      return <WinScreen />
  }
}

function App() {
  useIsDesktop()
  useBotTurn()
  useTurnTimer()

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: theme.color.bg,
        fontFamily: theme.font.body,
        color: theme.color.text,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CurrentScreen />
      <RulesModal />
      <AppHelpModal />
      <EventOverlay />
      <TurnChangeAnnouncement />
      <Toast />
    </div>
  )
}

export default App
