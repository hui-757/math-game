import { createRouter, createWebHashHistory } from 'vue-router'
import SelectView from '../views/SelectView.vue'
import MapView from '../views/MapView.vue'
import PlayView from '../views/PlayView.vue'
import ResultView from '../views/ResultView.vue'
import TeacherView from '../views/TeacherView.vue'

const routes = [
  { path: '/', name: 'select', component: SelectView },
  { path: '/map/:grade/:semester', name: 'map', component: MapView, props: true },
  { path: '/play/:levelId', name: 'play', component: PlayView, props: true },
  { path: '/result', name: 'result', component: ResultView },
  { path: '/teacher', name: 'teacher', component: TeacherView }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
