export type SegmentAction = 'keep' | 'remove' | 'speed'

export type SpeedFactor = 1.5 | 2 | 4

export interface VideoSegment {
  id: string
  startTime: number
  endTime: number
  action: SegmentAction
  speedFactor?: SpeedFactor
}
