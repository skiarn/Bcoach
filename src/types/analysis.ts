export type ShapeType = "line" | "circle";

export interface Shape {
  id: string;
  type: ShapeType;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  sourceWidth?: number;
  sourceHeight?: number;
  visibleFrom?: number;
  visibleTo?: number;
}

export interface FeedbackPin {
  id: string;
  timeOffset: number;
  text: string;
  tag?: string;
}

export interface SegmentFeedback {
  checklist: string[];
  notes: string[];
  nextSteps: string[];
  score?: number;
  pins?: FeedbackPin[];
}

export interface AnalysisSegment {
  id: string;
  startTime: number;
  endTime: number;
  skillId?: string;
  skillName?: string;
  attemptIndex: number;
  feedback: SegmentFeedback;
}

export type PlaybackEditAction = "remove" | "speed";

export interface PlaybackEditSegment {
  id: string;
  startTime: number;
  endTime: number;
  action: PlaybackEditAction;
  speedFactor?: 1.5 | 2 | 4;
}

interface EmbeddedAnalysisMetadataBase {
  savedAt: number;
  sportId?: string;
  skillId?: string;
  skillName?: string;
  // Legacy alias retained for compatibility with existing stored metadata.
  skillType?: string;
  sourceVideoName?: string;
  feedback: string[];
  nextSteps: string[];
  shapes: Shape[];
}

export interface EmbeddedAnalysisMetadataV1V2 extends EmbeddedAnalysisMetadataBase {
  schemaVersion: 1 | 2;
}

export interface EmbeddedAnalysisMetadataV3 extends EmbeddedAnalysisMetadataBase {
  schemaVersion: 3;
  analysisSegments: AnalysisSegment[];
  playbackEdits?: PlaybackEditSegment[];
}

export type EmbeddedAnalysisMetadata =
  | EmbeddedAnalysisMetadataV1V2
  | EmbeddedAnalysisMetadataV3;
