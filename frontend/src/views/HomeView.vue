<template>
  <header>
    <h1 class="display-4">{{ $t("title") }}</h1>
    <div id="desc-1">{{ $t("home.description_1") }}</div>

    <div id="desc-2">{{ $t("home.description_2") }}</div>
    <router-link
      to="/post_edit/"
      class="btn btn-outline-light default-input-width"
      id="try-button"
    >
      {{ $t("home.create_poll") }}
    </router-link>
  </header>
  <main>
    <div v-if="!auth.isAuthorized">
      <p>{{ $t("home.login_title") }}</p>
      <button
        @click="auth.login()"
        class="btn btn-primary default-input-width mt-1"
      >
        {{ $t("login") }}
      </button>
    </div>
    <div v-else>
      <h4>{{ $t("home.user_welcome", { userName: auth.user.name }) }}</h4>
      <div class="hstack gap-2 mt-3">
        <router-link to="/profile" class="btn btn-primary ms-auto">
          {{ $t("profile") }}
        </router-link>
        <button @click="auth.logout()" class="btn btn-primary me-auto">
          {{ $t("logout") }}
        </button>
      </div>
    </div>
  </main>
  <footer-element />
</template>

<style scoped lang="scss">
@import "~bootstrap/scss/functions";
@import "~bootstrap/scss/variables";

header {
  display: inline-block;
  position: relative;
  width: 100%;
  height: auto;
  line-height: $line-height-base;
  padding-top: 60px;
  padding-bottom: 40px;
  background: rgb(119, 0, 255);
  background: linear-gradient(
    0deg,
    rgba(119, 0, 255, 1) 0%,
    rgb(78, 58, 167) 100%
  );
  color: $white;
  text-align: center;
}

// h1 {
//   font-size: $font-size-base * 3;
//   font-weight: $font-weight-light;
// }

#desc-1 {
  margin-top: $spacer * 0.5;
  font-size: $font-size-base * 1.2;
}

#desc-2 {
  margin-top: $spacer * 2;
  font-size: $font-size-base * 1;
}

#try-button {
  display: inline-block;
  margin-top: $spacer * 0.5;
}

#profile-button {
  position: absolute;
  top: $spacer;
  right: $spacer;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "HomeView",
});
</script>
