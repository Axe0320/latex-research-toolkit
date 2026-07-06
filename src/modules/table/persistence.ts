import { getDB, migrate, type VersionedRecord } from '../../shared/persistence'
import type { TableModel } from './lib/table/types'

const SCHEMA_VERSION = 1
const SESSION_KEY = 'current'

interface TableSessionRecord extends VersionedRecord {
  tables: TableModel[]
  activeTableId: string
}

export interface TableSession {
  tables: TableModel[]
  activeTableId: string
}

export async function saveTableSession(session: TableSession): Promise<void> {
  const db = await getDB()
  const record: TableSessionRecord = { schemaVersion: SCHEMA_VERSION, ...session }
  await db.put('tableSessions', record, SESSION_KEY)
}

export async function loadTableSession(): Promise<TableSession | undefined> {
  const db = await getDB()
  const raw = await db.get('tableSessions', SESSION_KEY) as TableSessionRecord | undefined
  if (!raw) return undefined
  const record = migrate(raw, SCHEMA_VERSION, {})
  return { tables: record.tables, activeTableId: record.activeTableId }
}
