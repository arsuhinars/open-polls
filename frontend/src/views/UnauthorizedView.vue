<template>
  <header-element />
  <main>
    <h2>{{ $t("authorization_required") }}</h2>
    <button @click="auth.login()" class="btn btn-primary mt-3">
      {{ $t("login") }}
    </button>
  </main>
  <footer-element />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import auth from "../auth";

export default defineComponent({
  name: "UnauthorizedView",
  beforeRouteEnter(to, from, next) {
    if (auth.isAuthorized) {
      next({ name: "home" });
    } else {
      next();
    }
  },
});
</script>
