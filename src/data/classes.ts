/**
 * Quản lý lớp học.
 *
 * Trước đây file này dựng truy vấn Supabase ngay trong trình duyệt và trông cậy
 * vào RLS để chặn. Giờ nó chỉ gọi `/api/classes`; luật "lớp này có phải của tôi
 * không" nằm ở `src/server/guard.ts`.
 *
 * Giáo viên TỰ TẠO hồ sơ học sinh của lớp mình (nên là chủ hồ sơ), rồi thêm vào
 * lớp. Không có luồng "thêm học sinh của người khác vào lớp tôi": về mặt bảo vệ
 * dữ liệu trẻ em thì không nên có.
 */

import type { Grade } from '../content/types'
import { setStudentPin } from './api'
import { request } from './request'

export interface ClassRow {
  id: string
  name: string
  joinCode: string
  studentCount: number
}

export interface ClassStudent {
  id: string
  name: string
  avatar: string
  grade: Grade
  /** Chưa đặt mã PIN thì em đó chưa dùng được máy chung ở lớp. */
  hasPin: boolean
}

export interface ClassApi {
  listClasses(): Promise<ClassRow[]>
  createClass(name: string): Promise<ClassRow>
  deleteClass(classId: string): Promise<void>
  listStudents(classId: string): Promise<ClassStudent[]>
  addStudent(classId: string, input: { name: string; avatar: string; grade: Grade }): Promise<ClassStudent>
  removeStudent(classId: string, studentId: string): Promise<void>
  setPin(studentId: string, pin: string): Promise<void>
}

export const classApi: ClassApi = {
  async listClasses(): Promise<ClassRow[]> {
    const { classes } = await request<{ classes: ClassRow[] }>('/api/classes')
    return classes
  },

  async createClass(name: string): Promise<ClassRow> {
    const result = await request<{ class: ClassRow }>('/api/classes', {
      method: 'POST',
      body: { name },
    })
    return result.class
  },

  async deleteClass(classId: string): Promise<void> {
    await request(`/api/classes/${classId}`, { method: 'DELETE' })
  },

  async listStudents(classId: string): Promise<ClassStudent[]> {
    const { students } = await request<{ students: ClassStudent[] }>(
      `/api/classes/${classId}/students`,
    )
    return students
  },

  async addStudent(classId, input): Promise<ClassStudent> {
    const { student } = await request<{ student: ClassStudent }>(`/api/classes/${classId}/students`, {
      method: 'POST',
      body: input,
    })
    return student
  },

  async removeStudent(classId: string, studentId: string): Promise<void> {
    // Chỉ gỡ khỏi lớp, KHÔNG xoá hồ sơ - dữ liệu học tập của trẻ vẫn còn.
    await request(`/api/classes/${classId}/students/${studentId}`, { method: 'DELETE' })
  },

  setPin: setStudentPin,
}
