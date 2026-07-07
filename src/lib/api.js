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

// ========== 教师统计接口 ==========

export async function fetchClassStats(classId) {
  // 获取班级信息
  const { data: classData } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single()

  // 获取学生列表
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', classId)

  // 获取该班所有学生的进度
  const studentIds = students?.map(s => s.id) || []
  const { data: progressList } = await supabase
    .from('progress')
    .select('*')
    .in('student_id', studentIds)

  // 计算聚合统计
  const totalStudents = students?.length || 0
  const activeToday = students?.filter(s => {
    const today = new Date().toISOString().split('T')[0]
    return s.created_at?.startsWith(today)
  }).length || 0

  const avgAccuracy = progressList?.length
    ? progressList.reduce((sum, p) => sum + (p.correct_count / p.total_count), 0) / progressList.length
    : 0

  return {
    classId,
    className: classData?.name || '未知班级',
    totalStudents,
    activeToday,
    avgAccuracy: Math.round(avgAccuracy * 100) / 100,
    studentList: students?.map(s => ({
      id: s.id,
      name: s.nickname,
      completedLevels: progressList?.filter(p => p.student_id === s.id).length || 0
    })) || []
  }
}

// ========== Auth 接口 ==========

export async function findClassByCode(code) {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('code', code)
    .single()
  if (error) return null
  return data
}

export async function createStudent(classId, nickname) {
  const { data, error } = await supabase
    .from('students')
    .insert({ class_id: classId, nickname })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function findStudentByNickname(classId, nickname) {
  const { data } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', classId)
    .eq('nickname', nickname)
    .single()
  return data
}
