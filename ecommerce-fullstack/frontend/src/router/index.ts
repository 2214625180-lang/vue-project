import { createRouter, createWebHistory } from 'vue-router'
import BasicLayout from '../layout/BasicLayout.vue'
import AdminLayout from '../layout/AdminLayout.vue'
import Login from '../views/Login.vue'
import ShopHome from '../views/shop/Home.vue'
import ProductDetail from '../views/shop/ProductDetail.vue'
import Cart from '../views/shop/Cart.vue'
import Checkout from '../views/shop/Checkout.vue'
import Payment from '../views/shop/Payment.vue'
import OrderSuccess from '../views/shop/OrderSuccess.vue'
import MyOrders from '../views/user/MyOrders.vue'
import { useAuthStore } from '../store/auth'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

const router = createRouter({
  history: createWebHistory((import.meta as any).env?.BASE_URL || '/'),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/',
      component: BasicLayout,
      children: [
        {
          path: '',
          name: 'shop-home',
          component: ShopHome,
        },
        {
          path: 'shop/product/:spuId',
          name: 'product-detail',
          component: ProductDetail,
        },
        {
          path: 'shop/cart',
          name: 'cart',
          component: Cart,
          meta: { requiresAuth: true },
        },
        {
          path: 'shop/checkout',
          name: 'checkout',
          component: Checkout,
          meta: { requiresAuth: true },
        },
        {
          path: 'shop/payment',
          name: 'payment',
          component: Payment,
          meta: { requiresAuth: true },
        },
        {
          path: 'shop/order-success',
          name: 'order-success',
          component: OrderSuccess,
          meta: { requiresAuth: true },
        },
        {
          path: 'user/my-orders',
          name: 'my-orders',
          component: MyOrders,
          meta: { requiresAuth: true },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('../views/UserProfile.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'address',
          name: 'address',
          component: () => import('../views/user/AddressList.vue'),
          meta: { requiresAuth: true },
        }
      ]
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('../views/admin/Login.vue'),
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, role: 'ADMIN' },
      children: [
        {
          path: '',
          redirect: '/admin/dashboard',
        },
        {
          path: 'dashboard',
          name: 'admin-dashboard',
          component: () => import('../views/admin/Dashboard.vue'),
        },
        {
          path: 'products',
          name: 'admin-products',
          component: () => import('../views/admin/ProductList.vue'),
        },
        {
          path: 'orders',
          name: 'admin-orders',
          component: () => import('../views/admin/OrderList.vue'),
        }
      ]
    },
    {
      path: '/shop',
      redirect: '/'
    }
  ],
})

router.beforeEach((to, from) => {
  NProgress.start();
  const authStore = useAuthStore();

  // Admin Guard
  if (to.path.startsWith('/admin') && to.path !== '/admin/login') {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      NProgress.done();
      return { path: '/admin/login' };
    }
  }

  // User Guard (Only for non-admin routes that require auth)
  if (to.meta.requiresAuth && !to.path.startsWith('/admin') && !authStore.token) {
    NProgress.done();
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    };
  }
});

router.afterEach(() => {
  NProgress.done()
})

export default router
