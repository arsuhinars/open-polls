<template>
  <header-element />
  <main>
    <h2>{{ $t("page_was_not_found") }}</h2>
    <router-link to="/" class="btn btn-primary default-input-width mt-3">
      {{ $t("go_to_main_page") }}
    </router-link>
  </main>
  <footer-element />
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "NotFoundView",
});
</script>
