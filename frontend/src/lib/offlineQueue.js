// Write-side offline support: when an attendance/grade save fails because
// there's no network, queue it here instead of losing it. Flushed
// automatically on 'online' (see useOfflineSync) or manually via flush().
import { api } from './api';

const QUEUE_KEY = 'offline_write_queue_v1';
const CHANGED_EVENT = 'offline-queue-changed';

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function enqueue(item) {
  const queue = getQueue();
  queue.push({ ...item, id: crypto.randomUUID(), queuedAt: new Date().toISOString() });
  saveQueue(queue);
}

export function queueSize() {
  return getQueue().length;
}

async function send(item) {
  if (item.kind === 'attendance') {
    return api.markAttendance(item.token, item.classId, item.date, item.records);
  }
  if (item.kind === 'grades') {
    return api.enterGrades(item.token, item.classId, item.subject, item.gradingPeriod, item.records);
  }
  throw new Error(`unknown queued item kind: ${item.kind}`);
}

export async function flush() {
  const queue = getQueue();
  if (queue.length === 0) return { synced: 0, remaining: 0 };
  const remaining = [];
  let synced = 0;
  for (const item of queue) {
    try {
      await send(item);
      synced++;
    } catch {
      remaining.push(item);
    }
  }
  saveQueue(remaining);
  return { synced, remaining: remaining.length };
}

export const OFFLINE_QUEUE_CHANGED_EVENT = CHANGED_EVENT;
