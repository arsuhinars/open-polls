<template>
  <footer>
    <hr />
    <div class="hstack gap-2 justify-content-center">
      <a
        href="https://github.com/arsuhinars/open-polls"
        class="text-decoration-none"
      >
        <b-icon-github class="align-middle" />
        <span class="align-middle"> GitHub</span>
      </a>
      <div class="vr"></div>
      <div>{{ $t("copyright") }}</div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
@import "~bootstrap/scss/functions";
@import "~bootstrap/scss/variables";
@import "../scss/variables.scss";

footer {
  width: $main-width;
  margin: ($spacer * 2) auto ($spacer) auto;
  text-align: center;

  @media (max-width: $main-width) {
    width: auto;
    margin-left: $spacer;
    margin-right: $spacer;
  }
}
</style>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "FooterElement",
});
</script>
