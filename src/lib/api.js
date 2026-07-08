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

// ========== 班级接口 ==========

function generateClassCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createClass(name) {
  const code = generateClassCode()
  const { data, error } = await supabase
    .from('classes')
    .insert({ name, code })
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

// ========== 学生接口 ==========

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

// ========== 教师统计接口 ==========

export async function fetchClassStats(classId) {
  const { data: classData } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single()

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', classId)

  const studentIds = students?.map(s => s.id) || []
  const { data: progressList } = await supabase
    .from('progress')
    .select('*')
    .in('student_id', studentIds)

  const totalStudents = students?.length || 0
  const avgAccuracy = progressList?.length
    ? progressList.reduce((sum, p) => sum + (p.correct_count / p.total_count), 0) / progressList.length
    : 0

  return {
    classId,
    className: classData?.name || '未知班级',
    totalStudents,
    avgAccuracy: Math.round(avgAccuracy * 100) / 100,
    studentList: students?.map(s => ({
      id: s.id,
      studentNumber: s.student_number,
      name: s.nickname,
      completedLevels: progressList?.filter(p => p.student_id === s.id).length || 0
    })) || []
  }
}
