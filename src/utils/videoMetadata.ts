import { fetchFile } from "@ffmpeg/util";
import { EmbeddedAnalysisMetadata } from "../types/analysis.ts";
import { getFfmpeg, toSafeFileStem } from "./ffmpegClient.ts";
import { normalizeEmbeddedAnalysisMetadata } from "./analysisMetadata.ts";

export interface ExtractedVideoMetadata {
  metadata: EmbeddedAnalysisMetadata;
}

interface AnalyzedFileNameOptions {
  timestamp?: number;
  sportLabel?: string;
  skillName?: string;
}

function fileDataToUint8Array(fileData: unknown): Uint8Array {
  if (fileData instanceof Uint8Array) {
    return fileData;
  }

  if (typeof fileData === "string") {
    return new TextEncoder().encode(fileData);
  }

  if (fileData instanceof ArrayBuffer) {
    return new Uint8Array(fileData);
  }

  if (ArrayBuffer.isView(fileData)) {
    return new Uint8Array(
      fileData.buffer,
      fileData.byteOffset,
      fileData.byteLength,
    );
  }

  return new Uint8Array();
}

function isValidMetadata(value: unknown): value is EmbeddedAnalysisMetadata {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<EmbeddedAnalysisMetadata>;
  const hasValidSchema =
    candidate.schemaVersion === 1 ||
    candidate.schemaVersion === 2 ||
    candidate.schemaVersion === 3;

  const hasValidSegments =
    candidate.schemaVersion !== 3 ||
    Array.isArray(
      (candidate as { analysisSegments?: unknown }).analysisSegments,
    );

  return (
    hasValidSchema &&
    Array.isArray(candidate.feedback) &&
    Array.isArray(candidate.nextSteps) &&
    Array.isArray(candidate.shapes) &&
    hasValidSegments
  );
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeBase64(value: string): string {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder().decode(bytes);
}

function getExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
    return ".webm";
  }

  return fileName.slice(lastDotIndex);
}

function extractRecordingTimestamp(fileName: string): number | undefined {
  const match = fileName.match(/recording-(\d{10,})/i);
  if (!match) return undefined;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function sanitizeToken(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatFileDate(timestamp: number): string {
  const date = new Date(timestamp);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}${m}${d}-${hh}${mm}`;
}

export async function appendMetadataToVideo(
  videoBlob: Blob,
  metadata: EmbeddedAnalysisMetadata,
  fileName: string,
): Promise<Blob> {
  console.log("[Metadata] Getting FFmpeg instance...");
  const ffmpeg = await getFfmpeg();

  const extension = getExtension(fileName);
  const stem = toSafeFileStem(fileName);
  const inputName = `${stem}-input${extension}`;
  const outputName = `${stem}-output${extension}`;
  const encodedMetadata = encodeBase64(JSON.stringify(metadata));

  console.log(
    "[Metadata] Writing input file:",
    inputName,
    videoBlob.size,
    "bytes",
  );
  await ffmpeg.writeFile(inputName, await fetchFile(videoBlob));
  console.log("[Metadata] Input file written");

  console.log("[Metadata] Running ffmpeg exec...");
  const startTime = Date.now();

  try {
    await ffmpeg.exec([
      "-i",
      inputName,
      "-map",
      "0",
      "-c",
      "copy",
      "-metadata",
      `comment=bcoach:${encodedMetadata}`,
      "-movflags",
      "use_metadata_tags",
      outputName,
    ]);

    const elapsed = Date.now() - startTime;
    console.log("[Metadata] FFmpeg exec completed in", elapsed, "ms");
  } catch (error) {
    console.error("[Metadata] FFmpeg exec failed:", error);
    throw error;
  }

  console.log("[Metadata] Reading output file...");
  const outputData = fileDataToUint8Array(await ffmpeg.readFile(outputName));
  console.log("[Metadata] Output file read:", outputData.length, "bytes");

  console.log("[Metadata] Cleaning up temp files...");
  await Promise.all([
    ffmpeg.deleteFile(inputName).catch(() => {}),
    ffmpeg.deleteFile(outputName).catch(() => {}),
  ]);
  console.log("[Metadata] Cleanup done");

  const outputBytes = new Uint8Array(outputData.byteLength);
  outputBytes.set(outputData);

  return new Blob([outputBytes.buffer], {
    type: videoBlob.type || "video/webm",
  });
}

export async function extractMetadataFromVideo(
  videoBlob: Blob,
  fileName: string,
): Promise<ExtractedVideoMetadata | null> {
  const ffmpeg = await getFfmpeg();
  const extension = getExtension(fileName);
  const stem = toSafeFileStem(fileName);
  const inputName = `${stem}-probe${extension}`;
  const metadataName = `${stem}-metadata.txt`;

  await ffmpeg.writeFile(inputName, await fetchFile(videoBlob));

  try {
    await ffmpeg.exec(["-i", inputName, "-f", "ffmetadata", metadataName]);
  } catch {
    await Promise.all([
      ffmpeg.deleteFile(inputName).catch(() => {}),
      ffmpeg.deleteFile(metadataName).catch(() => {}),
    ]);

    return null;
  }

  const metadataData = fileDataToUint8Array(
    await ffmpeg.readFile(metadataName),
  );
  const metadataText = new TextDecoder().decode(metadataData);

  await Promise.all([
    ffmpeg.deleteFile(inputName).catch(() => {}),
    ffmpeg.deleteFile(metadataName).catch(() => {}),
  ]);

  const commentLine = metadataText
    .split("\n")
    .find((line) => line.toLowerCase().startsWith("comment="));

  if (!commentLine) {
    return null;
  }

  const value = commentLine.slice(commentLine.indexOf("=") + 1);
  if (!value.startsWith("bcoach:")) {
    return null;
  }

  const metadataJson = decodeBase64(value.slice("bcoach:".length));

  let parsed: unknown;
  try {
    parsed = JSON.parse(metadataJson);
  } catch {
    return null;
  }

  if (!isValidMetadata(parsed)) {
    return null;
  }

  const normalized = normalizeEmbeddedAnalysisMetadata(parsed);
  if (!normalized) {
    return null;
  }

  return {
    metadata: normalized,
  };
}

export function buildAnalyzedVideoFileName(
  baseName: string,
  options?: AnalyzedFileNameOptions,
): string {
  const trimmed = baseName.trim();
  const fallback = "analysis.webm";

  if (!trimmed) {
    return fallback;
  }

  const lastDotIndex = trimmed.lastIndexOf(".");
  const hasExtension = lastDotIndex > 0 && lastDotIndex < trimmed.length - 1;
  const extension = hasExtension ? trimmed.slice(lastDotIndex) : ".webm";

  const recordingTimestamp = extractRecordingTimestamp(trimmed);
  const hasContext = Boolean(
    options?.sportLabel?.trim() || options?.skillName?.trim(),
  );

  if (recordingTimestamp || hasContext) {
    const safeTimestamp =
      recordingTimestamp ?? options?.timestamp ?? Date.now();
    const sportToken = options?.sportLabel
      ? sanitizeToken(options.sportLabel)
      : "sport";
    const parts: string[] = [formatFileDate(safeTimestamp), sportToken];

    return `${parts.join("-")}${extension}`;
  }

  if (!hasExtension) {
    return `${trimmed}-analysis.webm`;
  }

  const name = trimmed.slice(0, lastDotIndex);
  return `${name}-analysis${extension}`;
}
