import { createRouter, createWebHashHistory } from 'vue-router'
import SelectView from '../views/SelectView.vue'
import SemesterView from '../views/SemesterView.vue'
import UnitView from '../views/UnitView.vue'
import PlayView from '../views/PlayView.vue'
import ResultView from '../views/ResultView.vue'
import TeacherView from '../views/TeacherView.vue'

const routes = [
  { path: '/', redirect: '/select' },
  { path: '/select', name: 'select', component: SelectView },
  { path: '/semester/:grade', name: 'semester', component: SemesterView, props: true },
  { path: '/unit/:grade/:semester', name: 'unit', component: UnitView, props: true },
  { path: '/play/:levelId', name: 'play', component: PlayView, props: true },
  { path: '/result', name: 'result', component: ResultView },
  { path: '/teacher', name: 'teacher', component: TeacherView }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
