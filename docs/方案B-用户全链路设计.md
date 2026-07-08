# 方案 B：班级码版 — 用户全链路设计

> 版本：v1.0 | 对应代码分支：main
> 设计目标：教师创建班级 → 学生加入班级 → 教师查看统计

---

## 1. 数据库改动（最小化）

### 1.1 只加 1 个字段

```sql
-- students 表增加学号字段
ALTER TABLE students ADD COLUMN student_number TEXT;

-- 给已有学生补学号（如果已有数据）
-- UPDATE students SET student_number = 'temp_' || id::text WHERE student_number IS NULL;

-- 加索引（可选，但推荐）
CREATE INDEX idx_students_number ON students(student_number);
```

### 1.2 为什么不动 progress 表

`progress.student_id` 保持 `uuid` 类型不变。前端逻辑：
1. 学生加入班级时，系统创建 `students` 记录，返回 `uuid`
2. 前端用 `uuid` 提交进度到 `progress` 表

**不改动 progress 表的好处**：避免迁移大量数据，保持现有 API 兼容。

### 1.3 数据关系图

```
classes (班级)
├── id (uuid)
├── code (text, 6位班级码, 如 "A3B7K9")
├── name (text, 班级名称)
├── teacher_pin (text, 4位PIN, 如 "1234")
└── students (一对多)
    ├── id (uuid)        ← 系统自动生成
    ├── class_id (uuid)  ← 关联 classes
    ├── student_number   ← 学生输入的学号
    ├── nickname         ← 学生输入的姓名
    └── progress (一对多)
        ├── student_id (uuid) ← 关联 students.id
        ├── level_id
        ├── correct_count
        └── ...
```

---

## 2. 用户全链路

### 2.1 教师链路

```
[教师打开网站]
    ↓
[教师入口] → 两个选项：
    ├─ "创建班级" → 输入班级名称（如"三（1）班"）
    │               → 系统生成：班级码 + 教师 PIN
    │               → 显示："请把班级码 [A3B7K9] 发给学生"
    │               → 自动进入教师面板
    │
    └─ "管理班级" → 输入班级码 + 教师 PIN
                    → 验证成功 → 进入教师面板
                    → 验证失败 → 提示错误
```

**教师面板内容**：
- 顶部：班级名称 + 班级码 + 学生人数
- 统计卡片：总闯关次数 / 平均正确率 / 平均用时
- 学生列表：学号 | 姓名 | 已闯关数 | 平均正确率 | 最近活跃
- 易错知识点：按单元统计全班错误率最高的题目类型
- 设置：修改班级名称 / 重置 PIN

### 2.2 学生链路（两种模式）

#### 模式 A：访客模式（未加入班级）

```
[学生打开网站]
    ↓
[首页] → 选年级 → 选册次 → 看单元列表
    ↓
点击"开始闯关" → [MapView] → 点击关卡 → [PlayView] 答题
    ↓
提交 → [ResultView] 显示成绩
    ↓
进度自动保存到 localStorage（本机有效）
```

**特点**：
- 不需要登录，开箱即玩
- 进度只存在本机，换设备/清缓存丢失
- 随时可以"加入班级"把本地进度同步到云端

#### 模式 B：班级模式（已加入班级）

```
[学生打开网站]
    ↓
[个人中心] → "加入班级" → 输入：
    • 班级码（教师给的，如 A3B7K9）
    • 学号（如 202311081080）
    • 姓名（如 小明）
    ↓
系统检查：
    • 班级码存在？→ 是
    • 该班级下已有此学号？→ 否 → 创建学生记录
    • 是 → 询问"是否已有记录？"→ 覆盖/取消
    ↓
创建成功 → 自动同步本地进度到云端
    ↓
回到首页 → 正常闯关 → 每次提交自动同步到云端
```

**已加入班级的学生使用流程**：
```
[首页] → 选年级 → 选册次 → 看单元列表
    ↓
点击"开始闯关" → [MapView] → 点击关卡 → [PlayView] 答题
    ↓
提交 → [ResultView] → 同时保存到本地 + 同步到云端
    ↓
教师面板可实时查看该学生的成绩
```

### 2.3 链路交叉点

| 场景 | 处理方式 |
|------|----------|
| 访客想加入班级，但本地已有进度 | 加入班级后，本地进度自动合并到云端（去重覆盖） |
| 已加入班级的学生换设备 | 输入班级码+学号+姓名 → 系统匹配已有记录 → 拉取云端进度到本地 |
| 教师想删除某个学生 | 教师面板 → 学生列表 → 删除（学生的进度记录保留，但不再关联班级） |
| 班级码泄露 | 教师可在面板重置班级码（原学生需重新加入） |

---

## 3. 前端页面设计

### 3.1 新增页面

#### JoinClassView（加入班级）

```vue
<template>
  <div class="join-page">
    <h2>加入班级</h2>
    <input v-model="classCode" placeholder="班级码（如 A3B7K9）" />
    <input v-model="studentNumber" placeholder="学号" />
    <input v-model="studentName" placeholder="姓名" />
    <button @click="join">加入班级</button>
    <p class="tip">加入后，你的闯关进度会自动同步到班级</p>
  </div>
</template>
```

#### TeacherLoginView（教师登录/创建）

```vue
<template>
  <div class="teacher-login">
    <!-- 选项卡：创建班级 / 管理班级 -->
    <div class="tabs">
      <button :class="{active: mode==='create'}" @click="mode='create'">创建班级</button>
      <button :class="{active: mode==='login'}" @click="mode='login'">管理班级</button>
    </div>

    <!-- 创建班级 -->
    <div v-if="mode==='create'">
      <input v-model="className" placeholder="班级名称（如 三（1）班）" />
      <button @click="createClass">创建</button>
      <div v-if="created">
        <p>班级码：{{ classCode }}</p>
        <p>教师 PIN：{{ teacherPin }}</p>
        <p>请截图保存，发给学生！</p>
      </div>
    </div>

    <!-- 管理班级 -->
    <div v-if="mode==='login'">
      <input v-model="classCode" placeholder="班级码" />
      <input v-model="pin" type="password" placeholder="教师 PIN" />
      <button @click="login">进入教师面板</button>
    </div>
  </div>
</template>
```

#### TeacherDashboardView（教师面板）

```vue
<template>
  <div class="dashboard">
    <header>
      <h2>{{ className }}</h2>
      <span>班级码：{{ classCode }}</span>
      <span>学生数：{{ studentCount }}</span>
    </header>

    <div class="stats">
      <div>总闯关：{{ totalAttempts }}</div>
      <div>平均正确率：{{ avgAccuracy }}%</div>
      <div>平均用时：{{ avgTime }}秒</div>
    </div>

    <div class="student-list">
      <h3>学生列表</h3>
      <table>
        <tr><th>学号</th><th>姓名</th><th>已闯关</th><th>正确率</th><th>最近活跃</th></tr>
        <tr v-for="s in students" :key="s.id">
          <td>{{ s.student_number }}</td>
          <td>{{ s.nickname }}</td>
          <td>{{ s.completedLevels }}</td>
          <td>{{ s.accuracy }}%</td>
          <td>{{ s.lastActive }}</td>
        </tr>
      </table>
    </div>

    <div class="weak-points">
      <h3>易错知识点</h3>
      <div v-for="wp in weakPoints" :key="wp.unit">
        {{ wp.unitName }}：错误率 {{ wp.errorRate }}%
      </div>
    </div>
  </div>
</template>
```

### 3.2 修改现有页面

#### TeacherView → 拆分为入口

当前 `TeacherView` 是学生个人中心，需要重命名或重构：
- **方案 1**：`TeacherView` 改为 `ProfileView`（个人中心），里面包含"加入班级"按钮
- **方案 2**：保留 `TeacherView` 作为教师入口，新增 `ProfileView` 作为学生个人中心

**推荐方案 2**：
- `ProfileView`：学生个人中心（显示自己的记录、加入班级按钮）
- `TeacherView`：教师入口（登录/创建/面板）
- `SelectView` 的"教师入口"按钮改为"教师登录"，新增"个人中心"按钮

#### SelectView（首页）

```
[小学数学闯关游戏]
    │
    ├─ 年级网格（1-6）
    │
    └─ 底部按钮：
        ├─ "个人中心" → ProfileView
        └─ "教师登录" → TeacherView（原教师入口）
```

---

## 4. API 接口设计

### 4.1 新增接口

```js
// ====== 班级接口 ======

// 创建班级
export async function createClass(name) {
  const code = generateRandomCode(6)   // 如 "A3B7K9"
  const pin = generateRandomPin(4)       // 如 "7251"
  const { data, error } = await supabase
    .from('classes')
    .insert({ name, code, teacher_pin: pin })
    .select()
    .single()
  if (error) throw error
  return { ...data, pin }  // 返回完整信息，包括 PIN
}

// 验证班级码+PIN
export async function verifyTeacher(classCode, pin) {
  const { data } = await supabase
    .from('classes')
    .select('*')
    .eq('code', classCode)
    .eq('teacher_pin', pin)
    .single()
  return data  // 成功返回班级对象，失败返回 null
}

// 根据班级码查询班级
export async function findClassByCode(code) {
  const { data } = await supabase
    .from('classes')
    .select('*')
    .eq('code', code)
    .single()
  return data
}

// ====== 学生接口 ======

// 根据学号+班级查询学生
export async function findStudentByNumber(classId, studentNumber) {
  const { data } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', classId)
    .eq('student_number', studentNumber)
    .single()
  return data
}

// 创建学生（加入班级）
export async function createStudent(classId, studentNumber, nickname) {
  const { data, error } = await supabase
    .from('students')
    .insert({ class_id: classId, student_number: studentNumber, nickname })
    .select()
    .single()
  if (error) throw error
  return data
}

// 获取班级所有学生（带统计）
export async function fetchClassStudents(classId) {
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('class_id', classId)
  
  // 获取每个学生的进度统计
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
```

### 4.2 修改现有接口

```js
// submitProgress 保持现状（使用 uuid），但前端需要先获取 student uuid
export async function submitProgress(payload) {
  // payload 需要包含 student_id (uuid)
  // 前端流程：studentNumber → 查询 uuid → 提交
}
```

---

## 5. 状态管理（Pinia）

### 5.1 authStore 扩展

```js
export const useAuthStore = defineStore('auth', () => {
  const student = ref(null)      // { id, student_number, nickname, class_id }
  const classInfo = ref(null)    // { id, code, name } — 教师登录时保存
  const teacherPin = ref('')     // 教师 PIN（本地不持久化，仅会话）

  // 学生登录（加入班级后）
  function setStudent(data) { ... }
  
  // 教师登录（管理班级）
  function setTeacherClass(data, pin) { ... }
  
  // 判断当前是学生还是教师
  const isTeacher = computed(() => !!classInfo.value && !!teacherPin.value)
  const isStudent = computed(() => !!student.value)
  
  // 退出
  function logout() {
    student.value = null
    classInfo.value = null
    teacherPin.value = ''
    localStorage.removeItem('math-game-student')
  }
  
  return { student, classInfo, teacherPin, isTeacher, isStudent, ... }
})
```

### 5.2 本地缓存 Schema 新增

| Key | 数据 | 说明 |
|-----|------|------|
| `math-game-student` | `{ id, student_number, nickname, class_id }` | 学生身份 |
| `math-game-class` | `{ id, code, name }` | 教师登录的班级（可选） |
| `math-game-progress` | 进度数组 | 本地备份（已有） |

---

## 6. 关键交互时序

### 6.1 学生加入班级（含进度同步）

```
[JoinClassView]
  → 用户输入：班级码 + 学号 + 姓名
  → 前端调用：findClassByCode(code)
    → 班级不存在？→ 提示"班级码错误"
    → 班级存在 → 获取 class_id
  → 前端调用：findStudentByNumber(classId, studentNumber)
    → 已存在？→ 提示"该学号已注册，请确认姓名" → 匹配姓名则登录
    → 不存在 → 调用 createStudent(classId, studentNumber, name)
  → 创建成功 → 保存 student 到 authStore + localStorage
  → 同步本地进度：
    → 遍历 localStorage 中的 progress_records
    → 每条调用 submitProgress({ student_id: newStudent.id, ... })
  → 跳转到 ProfileView（个人中心）
```

### 6.2 教师查看班级统计

```
[TeacherLoginView]
  → 输入班级码 + PIN
  → 前端调用：verifyTeacher(classCode, pin)
    → 验证失败 → 提示"班级码或PIN错误"
    → 验证成功 → 保存 classInfo 到 authStore
  → 进入 TeacherDashboardView
  → 页面加载时调用：fetchClassStudents(classId)
  → 渲染学生列表和统计
```

---

## 7. 安全与隐私

| 风险 | 措施 |
|------|------|
| 班级码被随机猜中 | 6位大小写字母+数字，约 20亿 组合；可限速 |
| 学生冒充他人学号 | 首次加入时创建记录，后续同一学号需要匹配姓名；教师可删除异常学生 |
| 教师 PIN 泄露 | 教师面板支持重置 PIN；PIN 只存在前端会话，不持久化 |
| 学生看到教师数据 | 教师数据只在 TeacherDashboardView 展示，需要 PIN 验证 |
| 进度数据篡改 | 当前 RLS 是 public，后续可加简单校验（如时间戳合理性） |

---

## 8. 实现优先级

| 阶段 | 内容 | 工时估计 |
|------|------|----------|
| **P0（本周）** | 数据库加字段 + 创建班级API + 加入班级API | 2h |
| **P1** | JoinClassView 页面 + ProfileView 页面 | 3h |
| **P2** | TeacherLoginView + TeacherDashboardView | 4h |
| **P3** | 进度同步逻辑（本地→云端） | 2h |
| **P4** | 教师面板统计图表（易错知识点） | 3h |
| **P5** | 安全增强（限速、校验） | 2h |

**合计**：约 16 小时，可分 2-3 天完成。

---

> 确认方案后，我可以按 P0 → P1 → P2 的顺序开始实现。
