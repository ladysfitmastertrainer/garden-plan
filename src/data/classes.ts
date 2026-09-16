/**
 * Quản lý lớp học - chỉ dùng khi đã cấu hình Supabase.
 *
 * Giáo viên TỰ TẠO hồ sơ học sinh của lớp mình (nên là chủ hồ sơ), rồi thêm vào
 * lớp. Không có luồng "thêm học sinh của người khác vào lớp tôi": RLS chặn việc
 * đó, và về mặt bảo vệ dữ liệu trẻ em thì cũng không nên có.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Grade } from '../content/types'

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

function check(error: { message: string } | null, what: string): void {
  if (error) throw new Error(`${what}: ${error.message}`)
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

export function createClassApi(client: SupabaseClient): ClassApi {
  return {
    async listClasses(): Promise<ClassRow[]> {
      const { data, error } = await client
        .from('classes')
        .select('id, name, join_code, class_members(count)')
        .order('created_at', { ascending: true })
      check(error, 'Không tải được danh sách lớp')

      return (
        (data as Array<{
          id: string
          name: string
          join_code: string
          class_members: Array<{ count: number }>
        }> | null) ?? []
      ).map((row) => ({
        id: row.id,
        name: row.name,
        joinCode: row.join_code,
        studentCount: row.class_members?.[0]?.count ?? 0,
      }))
    },

    async createClass(name: string): Promise<ClassRow> {
      const { data: auth } = await client.auth.getUser()
      if (!auth.user) throw new Error('Chưa đăng nhập')

      const { data, error } = await client
        .from('classes')
        // join_code do server sinh (hàm generate_join_code) - client không tự đặt.
        .insert({ teacher_id: auth.user.id, name: name.trim() })
        .select('id, name, join_code')
        .single()
      check(error, 'Không tạo được lớp')

      const row = data as { id: string; name: string; join_code: string }
      return { id: row.id, name: row.name, joinCode: row.join_code, studentCount: 0 }
    },

    async deleteClass(classId: string): Promise<void> {
      const { error } = await client.from('classes').delete().eq('id', classId)
      check(error, 'Không xoá được lớp')
    },

    async listStudents(classId: string): Promise<ClassStudent[]> {
      const { data, error } = await client
        .from('class_members')
        .select('students(id, name, avatar, grade, pin_hash)')
        .eq('class_id', classId)
      check(error, 'Không tải được danh sách học sinh')

      return (
        (data as Array<{
          students: { id: string; name: string; avatar: string; grade: number; pin_hash: string | null } | null
        }> | null) ?? []
      )
        .flatMap((row) => (row.students ? [row.students] : []))
        .map((s) => ({
          id: s.id,
          name: s.name,
          avatar: s.avatar,
          grade: s.grade as Grade,
          hasPin: s.pin_hash !== null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
    },

    async addStudent(classId, input): Promise<ClassStudent> {
      const { data: auth } = await client.auth.getUser()
      if (!auth.user) throw new Error('Chưa đăng nhập')

      const { data, error } = await client
        .from('students')
        .insert({
          owner_id: auth.user.id,
          name: input.name.trim(),
          avatar: input.avatar,
          grade: input.grade,
        })
        .select('id, name, avatar, grade')
        .single()
      check(error, 'Không tạo được hồ sơ học sinh')

      const student = data as { id: string; name: string; avatar: string; grade: number }
      const { error: linkError } = await client
        .from('class_members')
        .insert({ class_id: classId, student_id: student.id })
      check(linkError, 'Không thêm được học sinh vào lớp')

      await client.from('student_progress').insert({ student_id: student.id })

      return {
        id: student.id,
        name: student.name,
        avatar: student.avatar,
        grade: student.grade as Grade,
        hasPin: false,
      }
    },

    async removeStudent(classId: string, studentId: string): Promise<void> {
      // Chỉ gỡ khỏi lớp, KHÔNG xoá hồ sơ - dữ liệu học tập của trẻ vẫn còn.
      const { error } = await client
        .from('class_members')
        .delete()
        .eq('class_id', classId)
        .eq('student_id', studentId)
      check(error, 'Không gỡ được học sinh khỏi lớp')
    },

    async setPin(studentId: string, pin: string): Promise<void> {
      const { error } = await client.rpc('set_student_pin', {
        p_student_id: studentId,
        p_pin: pin,
      })
      check(error, 'Không đặt được mã PIN')
    },
  }
}
