export type ShapeType = 'line' | 'circle'

export interface Shape {
  id: string
  type: ShapeType
  startX: number
  startY: number
  endX: number
  endY: number
  sourceWidth?: number
  sourceHeight?: number
  visibleFrom?: number
  visibleTo?: number
}

export interface EmbeddedAnalysisMetadata {
  schemaVersion: 1
  savedAt: number
  skillName?: string
  skillType?: string
  sourceVideoName?: string
  feedback: string[]
  nextSteps: string[]
  shapes: Shape[]
}