/**
 * Repository trong bộ nhớ.
 *
 * Dùng cho test: chạy được trọn vòng lặp game mà không cần máy chủ nào. Cùng
 * interface `Repository` với `apiRepository` nên store không phân biệt được -
 * đó chính là lý do `configureRepository` vẫn tồn tại sau khi tầng lưu trữ rút
 * xuống còn một bản thật.
 */

import type { Grade } from '../content/types'
import {
  emptyProgress,
  type Repository,
  type StoredAttempt,
  type StudentProfile,
  type StudentProgress,
} from './types'

export function createMemoryRepository(): Repository & { reset: () => void } {
  let students: StudentProfile[] = []
  let progress = new Map<string, StudentProgress>()
  let attempts = new Map<string, StoredAttempt[]>()
  let counter = 0

  return {
    reset() {
      students = []
      progress = new Map()
      attempts = new Map()
      counter = 0
    },

    async listStudents() {
      return [...students].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
    },

    async createStudent(input: { name: string; avatar: string; grade: Grade }) {
      const now = Date.now()
      const student: StudentProfile = {
        id: `mem_${++counter}`,
        name: input.name,
        avatar: input.avatar,
        grade: input.grade,
        totalXp: 0,
        gold: 0,
        equippedItemIds: [],
        createdAt: now,
        lastPlayedAt: now,
      }
      students.push(student)
      progress.set(student.id, emptyProgress())
      return student
    },

    async saveStudent(student: StudentProfile) {
      const index = students.findIndex((s) => s.id === student.id)
      if (index === -1) students.push(student)
      else students[index] = student
    },

    async deleteStudent(studentId: string) {
      students = students.filter((s) => s.id !== studentId)
      progress.delete(studentId)
      attempts.delete(studentId)
    },

    async getProgress(studentId: string) {
      return { ...emptyProgress(), ...(progress.get(studentId) ?? {}) }
    },

    async saveProgress(studentId: string, value: StudentProgress) {
      progress.set(studentId, value)
    },

    async recordAttempts(records: StoredAttempt[]) {
      for (const record of records) {
        const existing = attempts.get(record.studentId) ?? []
        attempts.set(record.studentId, [...existing, record])
      }
    },

    async listAttempts(studentId: string, limit = 500) {
      return (attempts.get(studentId) ?? []).slice(-limit)
    },
  }
}
