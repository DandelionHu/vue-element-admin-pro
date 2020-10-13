import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'

NProgress.configure({ showSpinner: false }) // 进度条配置

const whiteList = ['/login', '/auth-redirect'] // 路由白名单
// 路由全局守卫
router.beforeEach(async(to, from, next) => {
  debugger
  // 进度条开始
  NProgress.start()

  // 设置页面title
  document.title = getPageTitle(to.meta.title)

  // 获取token
  const hasToken = getToken()

  if (hasToken) {
    // token存在
    if (to.path === '/login') {
      // 登录路由，重定向到首页
      next({ path: '/' })
      NProgress.done()
    } else {
      // 获取权限
      const hasRoles = store.getters.roles && store.getters.roles.length > 0
      if (hasRoles) {
        // 有权限
        next()
      } else {
        // 无权限
        try {
          // 请求权限
          const { roles } = await store.dispatch('user/getInfo')
          // 过滤权限
          const accessRoutes = await store.dispatch('permission/generateRoutes', roles)
          // 添加路由
          router.addRoutes(accessRoutes)
          // replace: true 不会回退到登录页面，导航将不会留下历史记录
          next({ ...to, replace: true })
        } catch (error) {
          // 清空token
          await store.dispatch('user/resetToken')
          Message.error(error || 'Has Error')
          // 重定向到登录
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    // token不存在
    if (whiteList.indexOf(to.path) !== -1) {
      // 检验路由是否在白名单
      next()
    } else {
      // 重定向到登录
      next(`/login?redirect=${to.path}`)
      // 结束进度条
      NProgress.done()
    }
  }
})
// 路由全局后置钩子
router.afterEach(() => {
  // 结束进度条
  NProgress.done()
})
