import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import UserProfile from '../views/UserProfile.vue'
import ShopHome from '../views/shop/Home.vue'
import ProductDetail from '../views/shop/ProductDetail.vue'
import Cart from '../views/shop/Cart.vue'
import Checkout from '../views/shop/Checkout.vue'
import Payment from '../views/shop/Payment.vue'
import OrderSuccess from '../views/shop/OrderSuccess.vue'
import MyOrders from '../views/user/MyOrders.vue'
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
      path: '/user/my-orders',
      name: 'my-orders',
      component: MyOrders,
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
    {
      path: '/shop/cart',
      name: 'cart',
      component: Cart,
      meta: { requiresAuth: true },
    },
    {
      path: '/shop/checkout',
      name: 'checkout',
      component: Checkout,
      meta: { requiresAuth: true },
    },
    {
      path: '/shop/payment',
      name: 'payment',
      component: Payment,
      meta: { requiresAuth: true },
    },
    {
      path: '/shop/order-success',
      name: 'order-success',
      component: OrderSuccess,
      meta: { requiresAuth: true },
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
