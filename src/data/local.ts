/**
 * Cài đặt Repository bằng IndexedDB (qua idb-keyval).
 *
 * Đây là tầng lưu trữ của MVP: chơi được hoàn toàn offline, không cần tài
 * khoản, không gửi dữ liệu của trẻ đi đâu. Giai đoạn sau, `supabase.ts` sẽ cài
 * cùng interface và đồng bộ lên server; tầng này vẫn được giữ làm bộ nhớ đệm
 * offline.
 */

import { del, get, set } from 'idb-keyval'
import type { Grade } from '../content/types'
import {
  emptyProgress,
  type Repository,
  type StoredAttempt,
  type StudentProfile,
  type StudentProgress,
} from './types'

const STUDENTS_KEY = 'hvtt:students'
const progressKey = (studentId: string) => `hvtt:progress:${studentId}`
const attemptsKey = (studentId: string) => `hvtt:attempts:${studentId}`

/** Giữ tối đa ngần này lần trả lời gần nhất mỗi học sinh, tránh phình dữ liệu. */
const MAX_STORED_ATTEMPTS = 2000

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const localRepository: Repository = {
  async listStudents(): Promise<StudentProfile[]> {
    const students = (await get<StudentProfile[]>(STUDENTS_KEY)) ?? []
    return [...students].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
  },

  async createStudent(input: { name: string; avatar: string; grade: Grade }): Promise<StudentProfile> {
    const now = Date.now()
    const student: StudentProfile = {
      id: newId(),
      name: input.name.trim(),
      avatar: input.avatar,
      grade: input.grade,
      totalXp: 0,
      gold: 0,
      equippedItemIds: [],
      createdAt: now,
      lastPlayedAt: now,
    }
    const students = (await get<StudentProfile[]>(STUDENTS_KEY)) ?? []
    await set(STUDENTS_KEY, [...students, student])
    await set(progressKey(student.id), emptyProgress())
    return student
  },

  async saveStudent(student: StudentProfile): Promise<void> {
    const students = (await get<StudentProfile[]>(STUDENTS_KEY)) ?? []
    const index = students.findIndex((s) => s.id === student.id)
    if (index === -1) students.push(student)
    else students[index] = student
    await set(STUDENTS_KEY, students)
  },

  async deleteStudent(studentId: string): Promise<void> {
    const students = (await get<StudentProfile[]>(STUDENTS_KEY)) ?? []
    await set(
      STUDENTS_KEY,
      students.filter((s) => s.id !== studentId),
    )
    await del(progressKey(studentId))
    await del(attemptsKey(studentId))
  },

  async getProgress(studentId: string): Promise<StudentProgress> {
    const stored = await get<StudentProgress>(progressKey(studentId))
    // Gộp với mặc định phòng khi dữ liệu cũ thiếu trường mới thêm sau này.
    return { ...emptyProgress(), ...(stored ?? {}) }
  },

  async saveProgress(studentId: string, progress: StudentProgress): Promise<void> {
    await set(progressKey(studentId), progress)
  },

  async recordAttempts(attempts: StoredAttempt[]): Promise<void> {
    if (attempts.length === 0) return
    const studentId = attempts[0]!.studentId
    const existing = (await get<StoredAttempt[]>(attemptsKey(studentId))) ?? []
    const merged = [...existing, ...attempts].slice(-MAX_STORED_ATTEMPTS)
    await set(attemptsKey(studentId), merged)
  },

  async listAttempts(studentId: string, limit = 500): Promise<StoredAttempt[]> {
    const attempts = (await get<StoredAttempt[]>(attemptsKey(studentId))) ?? []
    return attempts.slice(-limit)
  },
}
