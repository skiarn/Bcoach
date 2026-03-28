import { EmbeddedAnalysisMetadata } from '../types/analysis.ts'
import { extractMetadataFromVideo } from '../utils/videoMetadata.ts'
import { normalizeEmbeddedAnalysisMetadata } from '../utils/analysisMetadata.ts'

const DB_NAME = 'bcoach-video-library'
const DB_VERSION = 1
const STORE_NAME = 'videos'

export type VideoLibrarySource = 'imported' | 'exported'

export interface VideoLibraryRecord {
  id: string
  name: string
  mimeType: string
  size: number
  createdAt: number
  lastModified?: number
  source: VideoLibrarySource
  metadata?: EmbeddedAnalysisMetadata
  blob: Blob
}

export interface VideoLibraryListItem {
  id: string
  name: string
  mimeType: string
  size: number
  createdAt: number
  lastModified?: number
  source: VideoLibrarySource
  metadata?: EmbeddedAnalysisMetadata
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => Promise<T>): Promise<T> {
  return openDatabase().then((db) => {
    const transaction = db.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)

    return run(store).finally(() => {
      db.close()
    })
  })
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function generateId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now()}-${random}`
}

export async function upsertVideoRecord(record: VideoLibraryRecord): Promise<void> {
  const normalizedRecord: VideoLibraryRecord = {
    ...record,
    metadata: normalizeEmbeddedAnalysisMetadata(record.metadata),
  }

  await withStore('readwrite', async (store) => {
    await requestToPromise(store.put(normalizedRecord))
  })
}

export async function addImportedVideoFile(file: File, metadata?: EmbeddedAnalysisMetadata): Promise<string> {
  const id = generateId('video')

  await upsertVideoRecord({
    id,
    name: file.name,
    mimeType: file.type || 'video/webm',
    size: file.size,
    createdAt: Date.now(),
    lastModified: file.lastModified,
    source: 'imported',
    metadata,
    blob: file,
  })

  return id
}

export async function addExportedVideoBlob(blob: Blob, name: string, metadata: EmbeddedAnalysisMetadata): Promise<string> {
  const id = generateId('video')

  await upsertVideoRecord({
    id,
    name,
    mimeType: blob.type || 'video/webm',
    size: blob.size,
    createdAt: Date.now(),
    source: 'exported',
    metadata,
    blob,
  })

  return id
}

export async function listVideoLibraryItems(): Promise<VideoLibraryListItem[]> {
  const records = await withStore('readonly', async (store) => {
    return requestToPromise(store.getAll()) as Promise<VideoLibraryRecord[]>
  })

  return records
    .map((record) => ({
      id: record.id,
      name: record.name,
      mimeType: record.mimeType,
      size: record.size,
      createdAt: record.createdAt,
      lastModified: record.lastModified,
      source: record.source,
      metadata: normalizeEmbeddedAnalysisMetadata(record.metadata),
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
}

export async function getVideoLibraryRecord(id: string): Promise<VideoLibraryRecord | null> {
  return withStore('readonly', async (store) => {
    const record = await requestToPromise(store.get(id) as IDBRequest<VideoLibraryRecord | undefined>)
    if (!record) {
      return null
    }

    return {
      ...record,
      metadata: normalizeEmbeddedAnalysisMetadata(record.metadata),
    }
  })
}

export async function deleteVideoLibraryRecord(id: string): Promise<void> {
  await withStore('readwrite', async (store) => {
    await requestToPromise(store.delete(id))
  })
}

export async function hydrateRecordMetadata(record: VideoLibraryRecord): Promise<VideoLibraryRecord> {
  if (record.metadata) {
    const normalizedMetadata = normalizeEmbeddedAnalysisMetadata(record.metadata)
    if (JSON.stringify(normalizedMetadata) !== JSON.stringify(record.metadata)) {
      const updatedRecord: VideoLibraryRecord = {
        ...record,
        metadata: normalizedMetadata,
      }
      await upsertVideoRecord(updatedRecord)
      return updatedRecord
    }

    return {
      ...record,
      metadata: normalizedMetadata,
    }
  }

  try {
    const extracted = await extractMetadataFromVideo(record.blob, record.name)
    if (!extracted?.metadata) {
      return record
    }

    const updatedRecord: VideoLibraryRecord = {
      ...record,
      metadata: normalizeEmbeddedAnalysisMetadata(extracted.metadata),
    }

    await upsertVideoRecord(updatedRecord)
    return updatedRecord
  } catch {
    return record
  }
}