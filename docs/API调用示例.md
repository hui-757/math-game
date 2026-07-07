# API 调用示例

> **目标：降低后续开发的心智负担，复制粘贴即可用。**

---

## 一、题目接口

### 1.1 拉取某年级某册的全部题目

```js
import { fetchQuestions } from './lib/api.js'

// 拉取三年级下册所有题目
const questions = await fetchQuestions(3, 2)

// 返回：QuestionItem[]
// 每道题包含：id, grade, semester, unit, level, type, content, answer, display
```

**返回示例：**
```json
[
  {
    "id": "q-3-2-1-1-001",
    "grade": 3,
    "semester": 2,
    "unit": 1,
    "unit_name": "除数是一位数的除法",
    "level": 1,
    "type": "vertical",
    "difficulty": 1,
    "content": {
      "lines": [
        [{"type": "text", "text": "  "}, {"type": "blank", "id": "q0", "answer": "4"}, {"type": "blank", "id": "q1", "answer": "2"}],
        [{"type": "text", "text": "3)126"}]
      ]
    },
    "answer": "42",
    "display": "126 ÷ 3 = ?"
  }
]
```

### 1.2 按关卡过滤题目

```js
const all = await fetchQuestions(3, 2)
// 过滤出第1单元第1关的题
const levelQuestions = all.filter(q => q.unit === 1 && q.level === 1)
// levelQuestions.length === 10（每关10题）
```

### 1.3 批量导入题目（脚本用）

```js
import { importQuestions } from './lib/api.js'

const questions = [
  // ... 从 JSON 文件读取的题目数组
]

await importQuestions(questions)
// 返回：无（成功时）或报错
```

---

## 二、进度接口

### 2.1 获取某学生的闯关记录

```js
import { fetchProgress } from './lib/api.js'

const records = await fetchProgress('学生UUID')

// 返回：ProgressItem[]
// 每条包含：id, student_id, level_id, correct_count, total_count, time_seconds, mistakes
```

**返回示例：**
```json
[
  {
    "id": "uuid-xxx",
    "student_id": "uuid-student",
    "level_id": "3-2-1-1",
    "correct_count": 8,
    "total_count": 10,
    "time_seconds": 120,
    "mistakes": [
      {
        "questionId": "q-3-2-1-1-003",
        "userAnswer": {"q0": "3", "q1": "0"},
        "correctAnswer": {"q0": "4", "q1": "2"}
      }
    ],
    "created_at": "2025-07-06T10:00:00Z"
  }
]
```

### 2.2 提交闯关成绩

```js
import { submitProgress } from './lib/api.js'

await submitProgress({
  student_id: 'uuid-student',
  level_id: '3-2-1-1',        // grade-semester-unit-level
  correct_count: 8,
  total_count: 10,
  time_seconds: 120,
  mistakes: [
    {
      questionId: 'q-3-2-1-1-003',
      userAnswer: { q0: '3', q1: '0' },
      correctAnswer: { q0: '4', q1: '2' }
    }
  ]
})
```

---

## 三、教师统计接口

### 3.1 获取班级统计数据

```js
import { fetchClassStats } from './lib/api.js'

const stats = await fetchClassStats('班级UUID')

// 返回：ClassStats 对象
```

**返回示例：**
```json
{
  "classId": "uuid-class",
  "className": "三年级二班",
  "totalStudents": 45,
  "activeToday": 12,
  "avgAccuracy": 0.82,
  "unitStats": [
    { "unit": 1, "unitName": "除数是一位数的除法", "avgAccuracy": 0.75 },
    { "unit": 2, "unitName": "两位数乘两位数", "avgAccuracy": 0.88 }
  ],
  "weakQuestions": [
    { "questionId": "q-3-2-1-1-003", "display": "256 ÷ 4 = ?", "errorRate": 0.45 }
  ],
  "studentList": [
    { "id": "uuid-1", "name": "小明", "completedLevels": 8, "avgAccuracy": 0.90 }
  ]
}
```

---

## 四、Auth 接口

### 4.1 通过班级码查找班级

```js
import { findClassByCode } from './lib/api.js'

const cls = await findClassByCode('demo-3-2')
// 返回：{ id, code, name, teacher_pin } 或 null
```

### 4.2 注册学生（免密码）

```js
import { createStudent, findStudentByNickname } from './lib/api.js'

// 先查找是否已存在
let student = await findStudentByNickname(classId, '小明')

// 不存在则创建
if (!student) {
  student = await createStudent(classId, '小明')
}

// 返回：{ id, class_id, nickname, created_at }
```

---

## 五、Supabase 直连（高级）

如果需要在脚本里直接操作数据库：

```js
import { supabase } from './lib/supabase.js'

// 原始查询
const { data, error } = await supabase
  .from('questions')
  .select('*')
  .eq('grade', 3)
  .eq('semester', 2)
  .order('unit', { ascending: true })

// 聚合查询（教师统计用）
const { data } = await supabase
  .from('progress')
  .select('level_id, correct_count, total_count')
  .eq('student_id', 'uuid-xxx')
```

---

## 六、题型 content 结构速查

### 口算（oral）
```json
{
  "lines": [[
    {"type": "text", "text": "12 + 5 = "},
    {"type": "blank", "id": "b1", "answer": "17"}
  ]]
}
```

### 竖式（vertical）
```json
{
  "lines": [
    [{"type": "text", "text": "  "}, {"type": "blank", "id": "q0", "answer": "4"}, {"type": "blank", "id": "q1", "answer": "2"}],
    [{"type": "text", "text": "3)126"}]
  ]
}
```

### 脱式（step）
```json
{
  "lines": [[
    {"type": "text", "text": "3.5 + 2.5 × 2 = 3.5 + "},
    {"type": "blank", "id": "s1", "answer": "5"},
    {"type": "text", "text": " = "},
    {"type": "blank", "id": "s2", "answer": "8.5"}
  ]]
}
```

### 方程（equation）
```json
{
  "lines": [[
    {"type": "text", "text": "3x + 5 = 20"},
    {"type": "text", "text": "  x = "},
    {"type": "blank", "id": "e1", "answer": "5"}
  ]]
}
```

---

*接口契约详见 `接口契约.md`，本文档仅提供调用示例。*
