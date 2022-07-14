<template>
  <Transition name="modal" :duration="200">
    <div ref="modal" class="modal" style="display: block" v-show="isShowed">
      <div ref="modalDialog" class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ title }}</h5>
            <button
              type="button"
              class="btn-close"
              v-if="hasCloseButton"
              @click="isShowed = false"
            ></button>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div class="modal-footer">
            <button
              class="btn"
              :class="[getButtonHTMLClass(button.type)]"
              v-for="(button, index) in buttons"
              :key="index"
              @click="$emit('buttonClick', index, button)"
            >
              {{ button.text }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
  <Transition name="fade">
    <div class="modal-backdrop" v-if="isShowed"></div>
  </Transition>
</template>

<style scoped lang="scss">
@import "~bootstrap/scss/functions";
@import "~bootstrap/scss/variables";

.modal-backdrop {
  opacity: $modal-backdrop-opacity;
}
</style>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { ModalButton, ModalButtonType } from "../types";

export default defineComponent({
  name: "ModalDialog",
  props: {
    title: {
      type: String,
      required: true,
    },
    hasCloseButton: {
      type: Boolean,
      default: true,
    },
    buttons: {
      type: Object as PropType<Array<ModalButton>>,
      required: true,
    },
  },
  emits: ["show", "hide", "buttonClick"],
  data() {
    return {
      isShowed: false,
    };
  },
  computed: {
    modal() {
      return this.$refs.modal as HTMLElement;
    },
  },
  watch: {
    isShowed(newValue) {
      if (newValue) {
        this.$emit("show");
      } else {
        this.$emit("hide");
      }
    },
  },
  mounted() {
    this.modal.addEventListener("click", this.documentClickHandler);
  },
  unmounted() {
    this.modal.removeEventListener("click", this.documentClickHandler);
  },
  methods: {
    getButtonHTMLClass(buttonType: ModalButtonType) {
      switch (buttonType) {
        case ModalButtonType.Primary:
          return "btn-primary";
        case ModalButtonType.Secondary:
          return "btn-secondary";
      }
    },
    documentClickHandler(ev: Event) {
      const modalDialog = this.$refs.modalDialog as HTMLElement;

      if (
        this.isShowed &&
        !modalDialog.contains(ev.target as Node) &&
        ev.target != modalDialog &&
        this.hasCloseButton
      ) {
        this.isShowed = false;
      }
    },
  },
});
</script>
