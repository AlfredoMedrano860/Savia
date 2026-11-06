import type { TemaCodigo } from '../lib/banco'
import {
  ActivityIcon,
  ChartNetworkIcon,
  ChartNoAxesCombinedIcon,
  SunIcon,
  UsersRoundIcon,
  WaypointsIcon,
} from '@animateicons/react/lucide'
import { useIconosAnimados } from '../lib/useIconosAnimados'

export function IlustracionTema({ tema }: { tema: TemaCodigo }) {
  const animarIconos = useIconosAnimados()
  const props = { size: 34, className: 'tema-icono', isAnimated: animarIconos, 'aria-hidden': true as const }

  switch (tema) {
    case 'T19':
      return <ActivityIcon {...props} />
    case 'T20':
      return <UsersRoundIcon {...props} />
    case 'T21':
      return <SunIcon {...props} />
    case 'T22':
      return <WaypointsIcon {...props} />
    case 'T23':
      return <ChartNoAxesCombinedIcon {...props} />
    case 'T24':
      return <ChartNetworkIcon {...props} />
  }
}
