import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import UserProfile from '../views/UserProfile.vue'
import ShopHome from '../views/shop/Home.vue'
import ProductDetail from '../views/shop/ProductDetail.vue'
import { useAuthStore } from '../store/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/profile',
      name: 'profile',
      component: UserProfile,
      meta: { requiresAuth: true },
    },
    {
      path: '/',
      redirect: '/shop',
    },
    {
      path: '/shop',
      name: 'shop-home',
      component: ShopHome,
    },
    {
      path: '/shop/product/:spuId',
      name: 'product-detail',
      component: ProductDetail,
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.token) {
    next({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  } else {
    next()
  }
})

export default router
