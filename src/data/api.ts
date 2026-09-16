/**
 * Cài đặt `Repository` qua `/api`. Đây là tầng lưu trữ DUY NHẤT của app.
 *
 * Bản trước có ba tầng chồng nhau: IndexedDB để chơi offline, Supabase để lưu
 * lên mạng, và một `SyncingRepository` ở giữa với hàng đợi, bộ rút gọn hàng đợi
 * và luật hợp nhất khi hai máy sửa cùng một hồ sơ. Khoảng sáu trăm dòng, và là
 * phần khó gỡ lỗi nhất dự án - một con số sai sau buổi học không bao giờ dựng
 * lại được vì nó phụ thuộc vào thứ tự mất mạng.
 *
 * Giờ app yêu cầu luôn có mạng, nên cả ba tầng gộp lại còn một: ghi thẳng, đọc
 * thẳng, sai thì báo ngay. Đổi lại mất khả năng chơi khi rớt mạng - đó là cái
 * giá đã cân nhắc, không phải thiếu sót.
 */

import type { Grade } from '../content/types'
import { request } from './request'
import type { Repository, StoredAttempt, StudentProfile, StudentProgress } from './types'

export const apiRepository: Repository = {
  async listStudents(): Promise<StudentProfile[]> {
    const { students } = await request<{ students: StudentProfile[] }>('/api/students')
    return students
  },

  async createStudent(input: { name: string; avatar: string; grade: Grade }): Promise<StudentProfile> {
    const { student } = await request<{ student: StudentProfile }>('/api/students', {
      method: 'POST',
      body: input,
    })
    return student
  },

  async saveStudent(student: StudentProfile): Promise<void> {
    await request(`/api/students/${student.id}`, { method: 'PATCH', body: { student } })
  },

  async deleteStudent(studentId: string): Promise<void> {
    await request(`/api/students/${studentId}`, { method: 'DELETE' })
  },

  async getProgress(studentId: string): Promise<StudentProgress> {
    const { progress } = await request<{ progress: StudentProgress }>(
      `/api/students/${studentId}/progress`,
    )
    return progress
  },

  async saveProgress(studentId: string, progress: StudentProgress): Promise<void> {
    await request(`/api/students/${studentId}/progress`, { method: 'PUT', body: { progress } })
  },

  async recordAttempts(attempts: StoredAttempt[]): Promise<void> {
    if (attempts.length === 0) return
    // Mọi lần trả lời trong một lô đều của cùng một học sinh - `game.ts` gom theo
    // trận, và một trận chỉ có một em chơi.
    const studentId = attempts[0]!.studentId
    await request(`/api/students/${studentId}/attempts`, { method: 'POST', body: { attempts } })
  },

  async listAttempts(studentId: string, limit = 500): Promise<StoredAttempt[]> {
    const { attempts } = await request<{ attempts: StoredAttempt[] }>(
      `/api/students/${studentId}/attempts`,
      { query: { limit } },
    )
    return attempts
  },
}

/** Đặt mã PIN cho một học sinh - bắt buộc trước khi em đó dùng máy chung ở lớp. */
export async function setStudentPin(studentId: string, pin: string): Promise<void> {
  await request(`/api/students/${studentId}/pin`, { method: 'PUT', body: { pin } })
}
