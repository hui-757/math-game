# MapView 交接文档（关卡地图页面）

> 接手人：负责设计/实现地图视觉效果的同学
> 对应文件：`src/views/MapView.vue`
> 当前状态：垂直列表占位，需替换为真正的地图/路线/关卡节点

---

## 1. 这个页面是做什么的

用户在 **UnitView（单元列表）** 点击某个单元的 **"开始闯关"** 按钮后，会跳转到这个页面。这个页面负责展示**该单元下的所有关卡**，用地图/路线/节点的方式呈现，让用户选择要挑战哪一关。

当前流程：
```
UnitView → 点击"开始闯关" → MapView（你做的页面）→ 点击关卡 → PlayView（答题）
```

---

## 2. 输入：Props（从路由接收）

路由地址格式：`/map/{grade}/{semester}/{unit}`

| Props | 类型 | 示例 | 说明 |
|-------|------|------|------|
| `grade` | `string` | `"1"` | 年级 1~6 |
| `semester` | `string` | `"2"` | 学期：1=上册，2=下册 |
| `unit` | `string` | `"3"` | 单元序号（1,2,3...） |

**获取方式**：
```js
const props = defineProps(['grade', 'semester', 'unit'])
// 使用时需要 Number(props.unit) 转成数字
```

---

## 3. 数据怎么来

### 3.1 关卡数据

页面 `onMounted` 时已经帮你拉好数据了，结果存在 `levels` ref 里：

```js
const levels = ref([])
// 每个 level 对象格式：
// {
//   id: "1-2-3-1",      // levelId，唯一标识
//   name: "第1关",       // 关卡名称
//   unit: 3,            // 所属单元
//   level: 1,           // 关卡序号（当前每个unit只有1个）
//   index: 0            // 在数组中的索引（0,1,2...）
// }
```

**目前限制**：每个 unit 下只有 1 个 level（数据库设计如此），但代码已预留多 level 支持。未来可能一个 unit 有 3~5 关。

### 3.2 关卡状态（已完成/可闯/锁定）

调用 `getNodeStatus(level)` 函数，返回三种字符串之一：

| 返回值 | 含义 | 显示建议 |
|--------|------|----------|
| `"completed"` | 已通关 | 绿色、打勾/星星 |
| `"unlocked"` | 可挑战 | 黄色/高亮、可点击 |
| `"locked"` | 未解锁 | 灰色、不可点击 |

**解锁规则**（已写好，不要改）：
- 第 1 关始终解锁
- 后续关卡必须前一关已完成才解锁

---

## 4. 交互：点击关卡后做什么

```js
function goToLevel(level) {
  const status = getNodeStatus(level)
  if (status === 'locked') return   // 锁定关卡不响应点击
  router.push(`/play/${level.id}`)  // 跳转到答题页面
}
```

**level.id 格式**：`{grade}-{semester}-{unit}-{level}`，例 `"1-2-3-1"`

---

## 5. 返回按钮

页面顶部有返回按钮，点击应回到单元列表：

```js
router.push(`/unit/${grade}/${semester}`)
```

---

## 6. 你可以自由改的部分

以下全部可以重写，只要保留核心逻辑即可：

- ✅ `<template>` 全部重写 — 地图布局、SVG、Canvas、CSS 动画都可以
- ✅ `<style>` 全部重写 — 你自己的设计系统
- ✅ 关卡节点的表现形式 — 从文字列表改成圆形图标、城堡、旗帜等
- ✅ 路线绘制方式 — 可以用 SVG path、CSS 虚线、背景图等

---

## 7. 你**必须保留**的部分（不要删）

### 7.1 必须保留的导入

```js
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '../stores/progress.js'
import { useAuthStore } from '../stores/auth.js'
import { fetchQuestions } from '../lib/api.js'
```

### 7.2 必须保留的 Props 声明

```js
const props = defineProps(['grade', 'semester', 'unit'])
```

### 7.3 必须保留的 Store 和 Router 初始化

```js
const router = useRouter()
const progressStore = useProgressStore()
const authStore = useAuthStore()
```

### 7.4 必须保留的数据加载逻辑（onMounted 内的核心代码）

```js
onMounted(async () => {
  try {
    authStore.loadFromStorage()
    progressStore.loadFromStorage()
    if (authStore.student) {
      await progressStore.load(authStore.student.id)
    }
    const all = await fetchQuestions(Number(props.grade), Number(props.semester))

    // 只过滤当前 unit 的关卡
    const unitQuestions = all.filter(q => q.unit === Number(props.unit))
    const levelMap = new Map()
    unitQuestions.forEach(q => {
      const key = `${q.unit}-${q.level}`
      if (!levelMap.has(key)) {
        levelMap.set(key, {
          id: `${props.grade}-${props.semester}-${q.unit}-${q.level}`,
          name: `第${levelMap.size + 1}关`,
          unit: q.unit,
          level: q.level,
          index: levelMap.size
        })
      }
    })
    levels.value = Array.from(levelMap.values()).sort((a, b) => a.index - b.index)
    loading.value = false
  } catch (e) {
    error.value = '加载失败: ' + (e.message || '未知错误')
    loading.value = false
  }
})
```

### 7.5 必须保留的状态判断函数

```js
function getNodeStatus(level) {
  if (progressStore.isLevelCompleted(level.id)) return 'completed'
  const prevLevel = levels.value[level.index - 1]
  if (!prevLevel) return 'unlocked'
  if (progressStore.isLevelCompleted(prevLevel.id)) return 'unlocked'
  return 'locked'
}
```

### 7.6 必须保留的跳转函数

```js
function goToLevel(level) {
  const status = getNodeStatus(level)
  if (status === 'locked') return
  router.push(`/play/${level.id}`)
}
```

---

## 8. 设计建议（仅供参考）

### 8.1 布局思路

当前是垂直列表，建议改为：
- **蜿蜒路径**：关卡节点沿一条弯曲路线排列（如长城蜿蜒、取经路线等）
- **状态区分**：已完成=绿色旗帜+星星，可闯关=发光黄色节点，锁定=灰色锁图标
- **连线动画**：解锁新关卡时，从上一关到新关的路线有绘制动画

### 8.2 响应式

地图页面可能在手机、平板、电脑上都使用，建议：
- 手机：垂直蜿蜒，适合单手操作
- 平板/电脑：可以横向蜿蜒或更大面积的地图

### 8.3 当前已知限制

- 每个 unit 只有 1 关，所以地图可能只有一个节点。未来会扩充到多关。
- 没有动画系统（文档 `03-组件与状态协作契约` 3.7 节有预留规范）。
- 没有主题系统（文档 `03-组件与状态协作契约` 3.6 节有预留规划）。

---

## 9. 快速测试

改完后本地测试：
1. `npm run dev` 启动
2. 访问 `http://localhost:3000/#/select`
3. 选一个年级 → 选册次 → 选单元 → 点击"开始闯关"
4. 应该进入你设计的地图页面
5. 点击关卡节点应跳转到答题页面

---

## 10. 相关文件索引

| 文件 | 说明 |
|------|------|
| `src/views/MapView.vue` | **你负责的文件** |
| `src/views/UnitView.vue` | 跳转来源（"开始闯关"按钮） |
| `src/views/PlayView.vue` | 跳转目标（答题页面） |
| `src/stores/progress.js` | 进度状态（isLevelCompleted） |
| `src/lib/api.js` | fetchQuestions() 数据接口 |
| `docs/03-组件与状态协作契约.md` | 状态管理文档 |

---

> 如有疑问，请联系当前代码维护者。
