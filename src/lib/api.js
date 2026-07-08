import { supabase } from './supabase.js'

// ========== 题目接口 ==========

export async function fetchQuestions(grade, semester) {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('grade', grade)
    .eq('semester', semester)
    .order('unit', { ascending: true })
    .order('level', { ascending: true })
  if (error) throw error
  return data || []
}

export async function importQuestions(questions) {
  const { error } = await supabase.from('questions').upsert(questions)
  if (error) throw error
}

// ========== 进度接口 ==========

export async function fetchProgress(studentId) {
  const { data } = await supabase
    .from('progress')
    .select('*')
    .eq('student_id', studentId)
  return data || []
}

export async function submitProgress(payload) {
  const { error } = await supabase.from('progress').upsert(payload)
  if (error) throw error
}

// ========== 用户接口（学生/教师/管理员通用） ==========

export async function findUserByCredentials(studentNumber, school) {
  const { data } = await supabase
    .from('students')
    .select('*')
    .eq('student_number', studentNumber)
    .eq('school', school)
    .single()
  return data
}

export async function createUser({ nickname, studentNumber, school, role = 'student' }) {
  const { data, error } = await supabase
    .from('students')
    .insert({ nickname, student_number: studentNumber, school, role })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateUserClass(userId, classId) {
  const { data, error } = await supabase
    .from('students')
    .update({ class_id: classId })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ========== 班级接口 ==========

function generateClassCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createClass(name, teacherId) {
  const code = generateClassCode()
  const { data, error } = await supabase
    .from('classes')
    .insert({ name, code, teacher_pin: teacherId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function findClassByCode(code) {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('code', code)
    .single()
  if (error) return null
  return data
}

// ========== 教师申请接口 ==========

export async function submitTeacherApplication({ studentId, school }) {
  const { data, error } = await supabase
    .from('teacher_applications')
    .insert({ student_id: studentId, school })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchTeacherApplications() {
  const { data } = await supabase
    .from('teacher_applications')
    .select('*, students!student_id(nickname, student_number)')
    .order('created_at', { ascending: false })
  return data || []
}

export async function resolveTeacherApplication(id, status, adminId) {
  const { data, error } = await supabase
    .from('teacher_applications')
    .update({ status, resolved_at: new Date().toISOString(), resolved_by: adminId })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  // 如果批准，更新用户角色为 teacher
  if (status === 'approved') {
    const app = data
    await supabase
      .from('students')
      .update({ role: 'teacher' })
      .eq('id', app.student_id)
  }

  return data
}

export async function fetchMyApplication(studentId) {
  const { data } = await supabase
    .from('teacher_applications')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

// ========== 学生/班级成员接口 ==========

export async function findStudentByNumber(classId, studentNumber) {
  const { data } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', classId)
    .eq('student_number', studentNumber)
    .single()
  return data
}

export async function createStudent(classId, studentNumber, nickname) {
  const { data, error } = await supabase
    .from('students')
    .insert({ class_id: classId, student_number: studentNumber, nickname })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchClassStudents(classId) {
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', classId)

  const studentIds = students?.map(s => s.id) || []
  const { data: progressList } = await supabase
    .from('progress')
    .select('*')
    .in('student_id', studentIds)

  return students?.map(s => {
    const sProgress = progressList?.filter(p => p.student_id === s.id) || []
    return {
      ...s,
      completedLevels: sProgress.length,
      accuracy: sProgress.length
        ? Math.round(sProgress.reduce((sum, p) => sum + (p.correct_count / p.total_count), 0) / sProgress.length * 100)
        : 0,
      totalTime: sProgress.reduce((sum, p) => sum + (p.time_seconds || 0), 0)
    }
  }) || []
}

// ========== 管理员统计接口 ==========

export async function fetchPlatformStats() {
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')

  const { count: totalTeachers } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'teacher')

  const { count: totalClasses } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })

  const { count: totalProgress } = await supabase
    .from('progress')
    .select('*', { count: 'exact', head: true })

  const { count: pendingApplications } = await supabase
    .from('teacher_applications')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return {
    totalStudents: totalStudents || 0,
    totalTeachers: totalTeachers || 0,
    totalClasses: totalClasses || 0,
    totalProgress: totalProgress || 0,
    pendingApplications: pendingApplications || 0
  }
}
