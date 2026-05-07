export type Device = 'desktop' | 'tablet' | 'mobile'

export type Configs = Record<string, string>

export interface SectionProps {
  config: Configs
  setConfig: (updater: (prev: Configs) => Configs) => void
  device: Device
}
