<template>
  <header class="d-flex border-bottom text-nowrap align-items-center">
    <router-link to="/" class="text-decoration-none d-flex align-items-center">
      <b-icon-clipboard-check class="me-1" />
      {{ $t("title") }}
    </router-link>

    <div
      @click="isUserMenuActive = !isUserMenuActive"
      class="text-decoration-none text-reset ms-auto cursor-pointer user-select-none position-relative"
      ref="userMenuButton"
      v-if="auth.isAuthorized"
    >
      <span class="me-2" id="username-text">{{ auth.user.name }}</span>
      <div
        id="user-photo"
        :style="{ backgroundImage: `url(${auth.userPhoto})` }"
      ></div>

      <Transition name="scale">
        <div
          class="list-group fs-6 lh-base mt-2"
          id="user-menu"
          v-if="isUserMenuActive"
        >
          <router-link
            to="/profile"
            class="list-group-item list-group-item-action"
          >
            {{ $t("profile") }}
          </router-link>
          <button
            @click="auth.logout()"
            type="button"
            class="list-group-item list-group-item-action"
          >
            {{ $t("logout") }}
          </button>
        </div>
      </Transition>
    </div>
    <div
      @click="auth.login()"
      class="text-decoration-none text-reset ms-auto cursor-pointer user-select-none"
      v-else
    >
      <span class="me-2" id="login-text">{{ $t("login") }}</span>
      <b-icon-person-circle id="user-photo" />
    </div>
  </header>
</template>

<style scoped lang="scss">
@import "~bootstrap/scss/functions";
@import "~bootstrap/scss/variables";
@import "../scss/variables";

header {
  width: 100%;
  height: $header-height;
  font-size: $header-height * 0.45;
  line-height: $header-height;
  padding: $spacer * 0.25 $spacer * 1.5 $spacer * 0.25;
}

header > a {
  line-height: $header-height;
}

#username-text,
#login-text {
  font-size: $header-height * 0.4;
  vertical-align: middle;
}

#user-photo {
  display: inline-block;
  font-size: $header-height * 0.5;
  width: $header-height * 0.7;
  height: $header-height * 0.7;
  background-size: cover;
  border-radius: 50%;
  vertical-align: middle;
}

#user-menu {
  z-index: 10;
  min-width: 160px;
  position: absolute;
  top: 100%;
  right: -$spacer;
  transform-origin: top center;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "HeaderElement",
  data() {
    return {
      isUserMenuActive: false,
    };
  },
  mounted() {
    document.addEventListener("click", this.hideUserMenuEvent);
  },
  unmounted() {
    document.removeEventListener("click", this.hideUserMenuEvent);
  },
  methods: {
    hideUserMenuEvent(ev: Event) {
      const userMenuButton = this.$refs.userMenuButton as HTMLElement;

      if (
        this.isUserMenuActive &&
        !(
          ev.target == userMenuButton ||
          userMenuButton.contains(ev.target as Node)
        )
      ) {
        this.isUserMenuActive = false;
      }
    },
  },
});
</script>
