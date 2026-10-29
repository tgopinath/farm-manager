// Types for summary.js, which is a byte-for-byte copy of server/src/summary.js
// so the in-browser demo computes reminders exactly as the server does.
import type { Rec, Summary } from './api'

type Data = Record<string, Rec[]>
export function summary(data: Data, today?: string): Summary
