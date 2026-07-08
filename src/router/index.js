import { createRouter, createWebHashHistory } from 'vue-router'
import SelectView from '../views/SelectView.vue'
import SemesterView from '../views/SemesterView.vue'
import UnitView from '../views/UnitView.vue'
import MapView from '../views/MapView.vue'
import PlayView from '../views/PlayView.vue'
import ResultView from '../views/ResultView.vue'
import TeacherView from '../views/TeacherView.vue'
import ProfileView from '../views/ProfileView.vue'
import AuthView from '../views/AuthView.vue'
import StudentVerifyView from '../views/StudentVerifyView.vue'
import AdminView from '../views/AdminView.vue'

const routes = [
  { path: '/', redirect: '/select' },
  { path: '/select', name: 'select', component: SelectView },
  { path: '/semester/:grade', name: 'semester', component: SemesterView, props: true },
  { path: '/unit/:grade/:semester', name: 'unit', component: UnitView, props: true },
  { path: '/map/:grade/:semester/:unit', name: 'map', component: MapView, props: true },
  { path: '/play/:levelId', name: 'play', component: PlayView, props: true },
  { path: '/result', name: 'result', component: ResultView },
  { path: '/teacher', name: 'teacher', component: TeacherView },
  { path: '/profile', name: 'profile', component: ProfileView },
  { path: '/auth', name: 'auth', component: AuthView },
  { path: '/verify', name: 'verify', component: StudentVerifyView },
  { path: '/admin', name: 'admin', component: AdminView }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
