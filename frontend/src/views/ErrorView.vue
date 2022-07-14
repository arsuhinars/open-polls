<template>
  <header-element />
  <main>
    <h2>{{ errorTitle }}</h2>
    <p class="mt-2">{{ errorDescription }}</p>
    <button
      @click="auth.login()"
      class="btn btn-primary default-input-width mt-3"
    >
      {{ $t("go_to_main_page") }}
    </button>
  </main>
  <footer-element />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ErrorTypes } from "open-polls";
import { getErrorTitleKey, getErrorDescriptionKey } from "@/utils";

export default defineComponent({
  name: "ErrorView",
  data() {
    let errorType = parseInt(this.$route.params.errorType.toString(), 10);
    return {
      errorTitle: this.$t(getErrorTitleKey(errorType)),
      errorDescription: this.$t(getErrorDescriptionKey(errorType)),
    };
  },
  beforeRouteEnter(to, from, next) {
    if (to.params.errorType == ErrorTypes.AUTHORIZATION_REQUIRED.toString()) {
      next("unauthorized");
    } else {
      next();
    }
  },
  mounted() {
    document.title = this.errorTitle;
  },
});
</script>
