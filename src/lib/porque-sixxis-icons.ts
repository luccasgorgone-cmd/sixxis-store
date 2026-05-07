import {
  Award, Truck, Headphones, Package,
  Shield, Star, Heart, Zap,
  Clock, ThumbsUp, MapPin, BadgeCheck,
  Cpu, Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PorQueSixxisIconName } from './porque-sixxis-defaults'

export const PQ_SIXXIS_ICONS: Record<PorQueSixxisIconName, LucideIcon> = {
  Award, Truck, Headphones, Package,
  Shield, Star, Heart, Zap,
  Clock, ThumbsUp, MapPin, BadgeCheck,
  Cpu, Sparkles,
}

export function getPqSixxisIcon(name?: string | null): LucideIcon {
  if (name && name in PQ_SIXXIS_ICONS) {
    return PQ_SIXXIS_ICONS[name as PorQueSixxisIconName]
  }
  return Star
}
