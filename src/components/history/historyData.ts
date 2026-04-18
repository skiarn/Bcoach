import { EmbeddedAnalysisMetadata } from "../../types/analysis.ts";
import { VideoLibraryListItem } from "../../services/videoLibrary.ts";
import { getSportLabel } from "../../utils/sports.ts";
import { getCurrentLocale } from "../../utils/locale.ts";
import { findSkillById } from "../../utils/skills.ts";

export type DashboardRange = "7d" | "30d" | "all";

export interface HistoryTrendPoint {
  dayKey: string;
  label: string;
  feedback: number;
  sessions: number;
  nextSteps: number;
}

export interface HistorySkillProgressItem {
  typeLabel: string;
  skillName: string;
  sessions: number;
  feedbackTotal: number;
  nextStepsTotal: number;
  latestTimestamp: number;
}

export interface DashboardStats {
  rangeLabel: string;
  totalSessions: number;
  totalFeedbackPoints: number;
  totalNextSteps: number;
  avgFeedbackPerSession: number;
  avgNextStepsPerSession: number;
  streakDays: number;
  xp: number;
  currentLevel: number;
  levelProgress: number;
  nextLevelTarget: number;
  badges: Array<{ id: string; label: string; unlocked: boolean }>;
  topFeedbackTopics: Array<[string, number]>;
  maxTopicCount: number;
  trendPoints: HistoryTrendPoint[];
  trendMaxFeedback: number;
  skillProgress: HistorySkillProgressItem[];
}

export function getDayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getSkillTypeLabel(skillType?: string): string {
  return getSportLabel(skillType);
}

function getLocaleDateTag(): string {
  return getCurrentLocale() === "en" ? "en-US" : "sv-SE";
}

function getNoSelectedSkillLabel(): string {
  return getCurrentLocale() === "en"
    ? "No selected technique"
    : "Utan vald teknik";
}

function getRangeStartTimestamp(
  range: DashboardRange,
  nowTimestamp: number,
): number {
  if (range === "7d") return nowTimestamp - 7 * 24 * 60 * 60 * 1000;
  if (range === "30d") return nowTimestamp - 30 * 24 * 60 * 60 * 1000;
  return 0;
}

function metadataOrEmpty(
  metadata?: EmbeddedAnalysisMetadata,
): EmbeddedAnalysisMetadata {
  return (
    metadata ?? {
      schemaVersion: 2,
      savedAt: 0,
      feedback: [],
      nextSteps: [],
      shapes: [],
    }
  );
}

interface HistorySkillKey {
  typeLabel: string;
  skillName: string;
}

function getItemSkillKeys(
  metadata?: EmbeddedAnalysisMetadata,
): HistorySkillKey[] {
  const normalizedMetadata = metadataOrEmpty(metadata);
  const locale = getCurrentLocale();
  const uniqueSkills = new Map<string, HistorySkillKey>();

  if (
    normalizedMetadata.schemaVersion === 3 &&
    normalizedMetadata.analysisSegments.length > 0
  ) {
    normalizedMetadata.analysisSegments.forEach((segment) => {
      const resolvedSkill = findSkillById(segment.skillId, locale);
      const skillName = segment.skillName?.trim() || resolvedSkill?.name;

      if (!skillName) {
        return;
      }

      const typeLabel = getSkillTypeLabel(
        resolvedSkill?.sportId ??
          normalizedMetadata.sportId ??
          normalizedMetadata.skillType,
      );
      const key = `${typeLabel}::${skillName}`;

      if (!uniqueSkills.has(key)) {
        uniqueSkills.set(key, { typeLabel, skillName });
      }
    });
  }

  if (uniqueSkills.size === 0) {
    const typeLabel = getSkillTypeLabel(
      normalizedMetadata.sportId ?? normalizedMetadata.skillType,
    );
    const skillName =
      normalizedMetadata.skillName?.trim() || getNoSelectedSkillLabel();
    uniqueSkills.set(`${typeLabel}::${skillName}`, { typeLabel, skillName });
  }

  return Array.from(uniqueSkills.values());
}

export function computeDashboardStats(
  items: VideoLibraryListItem[],
  range: DashboardRange,
): DashboardStats {
  const nowTimestamp = Date.now();
  const rangeStartTimestamp = getRangeStartTimestamp(range, nowTimestamp);

  const dashboardItems =
    range === "all"
      ? items
      : items.filter((item) => item.createdAt >= rangeStartTimestamp);

  const sortedItems = [...dashboardItems].sort(
    (a, b) => a.createdAt - b.createdAt,
  );
  const totalSessions = dashboardItems.length;
  const totalFeedbackPoints = dashboardItems.reduce(
    (sum, item) => sum + metadataOrEmpty(item.metadata).feedback.length,
    0,
  );
  const totalNextSteps = dashboardItems.reduce(
    (sum, item) => sum + metadataOrEmpty(item.metadata).nextSteps.length,
    0,
  );

  const avgFeedbackPerSession =
    totalSessions > 0 ? totalFeedbackPoints / totalSessions : 0;
  const avgNextStepsPerSession =
    totalSessions > 0 ? totalNextSteps / totalSessions : 0;
  const rangeLabel = range;

  const sessionDaySet = new Set(
    dashboardItems.map((item) => getDayKey(item.createdAt)),
  );
  let streakDays = 0;
  const streakDate = new Date();
  while (true) {
    const key = getDayKey(streakDate.getTime());
    if (!sessionDaySet.has(key)) break;
    streakDays += 1;
    streakDate.setDate(streakDate.getDate() - 1);
  }

  const xp =
    totalSessions * 100 + totalFeedbackPoints * 5 + totalNextSteps * 15;
  const xpPerLevel = 500;
  const currentLevel = Math.max(1, Math.floor(xp / xpPerLevel) + 1);
  const currentLevelFloor = (currentLevel - 1) * xpPerLevel;
  const nextLevelTarget = currentLevel * xpPerLevel;
  const levelProgress = Math.max(
    0,
    Math.min(100, ((xp - currentLevelFloor) / xpPerLevel) * 100),
  );

  const weeklySessions = dashboardItems.filter(
    (item) => item.createdAt >= nowTimestamp - 7 * 24 * 60 * 60 * 1000,
  ).length;
  const badges = [
    { id: "first", label: "Forsta passet", unlocked: totalSessions >= 1 },
    { id: "weekly", label: "Veckans slitare", unlocked: weeklySessions >= 5 },
    { id: "streak", label: "Streak 3 dagar", unlocked: streakDays >= 3 },
    {
      id: "reflect",
      label: "Djup analys",
      unlocked: avgFeedbackPerSession >= 4,
    },
    { id: "veteran", label: "Video-veteran", unlocked: totalSessions >= 15 },
  ];

  const feedbackTopicCount = new Map<string, number>();
  dashboardItems.forEach((item) => {
    metadataOrEmpty(item.metadata).feedback.forEach((feedback) => {
      const key = feedback.trim();
      if (!key) return;
      feedbackTopicCount.set(key, (feedbackTopicCount.get(key) ?? 0) + 1);
    });
  });

  const topFeedbackTopics = Array.from(feedbackTopicCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxTopicCount = topFeedbackTopics[0]?.[1] ?? 1;

  const trendByDay = new Map<string, HistoryTrendPoint>();
  sortedItems.forEach((item) => {
    const dayKey = getDayKey(item.createdAt);
    const metadata = metadataOrEmpty(item.metadata);
    const existing = trendByDay.get(dayKey);
    const label = new Date(item.createdAt).toLocaleDateString(
      getLocaleDateTag(),
      { month: "short", day: "numeric" },
    );

    if (existing) {
      existing.feedback += metadata.feedback.length;
      existing.sessions += 1;
      existing.nextSteps += metadata.nextSteps.length;
      return;
    }

    trendByDay.set(dayKey, {
      dayKey,
      label,
      feedback: metadata.feedback.length,
      sessions: 1,
      nextSteps: metadata.nextSteps.length,
    });
  });

  const trendPoints = Array.from(trendByDay.values())
    .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
    .slice(-8);
  const trendMaxFeedback = trendPoints.reduce(
    (max, point) => Math.max(max, point.feedback),
    1,
  );

  const skillProgressMap = new Map<string, HistorySkillProgressItem>();
  dashboardItems.forEach((item) => {
    const metadata = metadataOrEmpty(item.metadata);
    const itemSkillKeys = getItemSkillKeys(metadata);

    itemSkillKeys.forEach(({ typeLabel, skillName }) => {
      const key = `${typeLabel}::${skillName}`;
      const existing = skillProgressMap.get(key);

      if (existing) {
        existing.sessions += 1;
        existing.feedbackTotal += metadata.feedback.length;
        existing.nextStepsTotal += metadata.nextSteps.length;
        existing.latestTimestamp = Math.max(
          existing.latestTimestamp,
          item.createdAt,
        );
        return;
      }

      skillProgressMap.set(key, {
        typeLabel,
        skillName,
        sessions: 1,
        feedbackTotal: metadata.feedback.length,
        nextStepsTotal: metadata.nextSteps.length,
        latestTimestamp: item.createdAt,
      });
    });
  });

  const skillProgress = Array.from(skillProgressMap.values()).sort(
    (a, b) => b.sessions - a.sessions || b.latestTimestamp - a.latestTimestamp,
  );

  return {
    rangeLabel,
    totalSessions,
    totalFeedbackPoints,
    totalNextSteps,
    avgFeedbackPerSession,
    avgNextStepsPerSession,
    streakDays,
    xp,
    currentLevel,
    levelProgress,
    nextLevelTarget,
    badges,
    topFeedbackTopics,
    maxTopicCount,
    trendPoints,
    trendMaxFeedback,
    skillProgress,
  };
}

export function groupItemsBySkill(
  items: VideoLibraryListItem[],
): Record<string, Record<string, VideoLibraryListItem[]>> {
  return items.reduce<Record<string, Record<string, VideoLibraryListItem[]>>>(
    (acc, item) => {
      const itemSkillKeys = getItemSkillKeys(item.metadata);

      itemSkillKeys.forEach(({ typeLabel, skillName }) => {
        if (!acc[typeLabel]) {
          acc[typeLabel] = {};
        }

        if (!acc[typeLabel][skillName]) {
          acc[typeLabel][skillName] = [];
        }

        acc[typeLabel][skillName].push(item);
      });

      return acc;
    },
    {},
  );
}
