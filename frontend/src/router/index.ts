import { nextTick } from "vue";
import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import auth from "../auth";
import i18n from "@/i18n";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "home",
    component: () =>
      import(/* webpackChunkName: "home-view" */ "../views/HomeView.vue"),
  },
  {
    path: "/profile",
    name: "profile",
    component: () =>
      import(/* webpackChunkName: "profile-view" */ "../views/ProfileView.vue"),
    meta: {
      title: i18n.global.t("profile"),
      authRequired: true,
    },
  },
  {
    path: "/post/:postId(\\d+)",
    name: "post",
    component: () =>
      import(/* webpackChunkName: "post-view" */ "../views/PostView.vue"),
  },
  {
    path: "/post_edit/:postId(\\d*)",
    name: "post_edit",
    component: () =>
      import(
        /* webpackChunkName: "post-edit-view" */ "../views/PostEditView.vue"
      ),
    meta: {
      title: i18n.global.t("post_edit.title"),
    },
  },
  {
    path: "/handleError/:errorType(\\d+)",
    name: "errorHandler",
    component: () => import("../views/ErrorView.vue"),
  },
  {
    path: "/unauthorized",
    name: "unauthorizedPage",
    component: import("../views/UnauthorizedView.vue"),
    meta: {
      title: i18n.global.t("authorization_required"),
    },
  },
  {
    path: "/:pathMatch(.*)",
    name: "notFoundPage",
    component: import("../views/NotFoundView.vue"),
    meta: {
      title: i18n.global.t("page_was_not_found"),
    },
  },
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to, from, next) => {
  await auth.checkAuthorization();

  if (to.meta.authRequired && !auth.isAuthorized) {
    next("unauthorized");
  } else {
    next();
  }
});

router.afterEach((to) => {
  nextTick(() => {
    document.title = (to.meta.title as string) || i18n.global.t("title");
  });
});

export default router;
