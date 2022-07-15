<template>
  <div
    ref="pollContainer"
    class="poll-container shadow"
    :class="{ ['poll-style-' + poll.style]: true }"
  >
    <div v-if="isEditor">
      <label class="form-label mt-1" :for="pollNameInputId">
        {{ $t("poll_name_input") }}
      </label>
      <input
        @input="onEditorInput"
        type="text"
        class="form-control form-control-sm"
        :id="pollNameInputId"
        v-model="editedPoll.name"
        maxlength="32"
        required
      />
      <div class="invalid-feedback">
        {{ $t("validation_errors.required") }}
      </div>

      <b-icon-trash3
        @click="$emit('delete')"
        class="post-delete-button cursor-pointer"
      />

      <label class="form-label d-block mt-3">
        {{ $t("poll_option_input") }}
      </label>
      <div
        class="d-flex mb-2 w-100"
        v-for="(option, index) in editedPoll.options"
        :key="option"
        ref="options"
      >
        <input
          @input="onEditorInput"
          @change="(ev) => (editedPoll.options[index] = ev.target.value)"
          type="text"
          class="form-control form-control-sm flex-grow-1"
          :value="option"
          maxlength="32"
          required
        />
        <button
          @click="editedPoll.options.splice(index, 1)"
          class="btn btn-outline-light ms-2 fs-3 align-self-stretch poll-remove-option-button"
        >
          <b-icon-dash class="d-block" />
        </button>
      </div>
      <div class="invalid-feedback mb-2">
        {{ $t("validation_errors.required_plural") }}
      </div>
      <div
        class="invalid-feedback"
        :style="{
          display:
            wasEditorOptionValidated &&
            (!editedPoll.options || editedPoll.options.length == 0)
              ? 'block'
              : '',
        }"
      >
        {{ $t("validation_errors.empty_poll_options") }}
      </div>
      <b-icon-plus
        @click="addOption"
        class="btn btn-outline-light d-block mx-auto fs-4 poll-add-option-button"
      />
      <div>
        <label class="form-label mt-2">
          {{ $t("poll_max_chosen_options_count") }}
        </label>
        <input
          @input="onEditorInput"
          type="number"
          class="form-control form-control-sm"
          min="1"
          :max="editedPoll.options.length"
          v-model="editedPoll.maxChosenOptionsCount"
          required
        />
      </div>
      <div class="invalid-feedback">
        {{ $t("validation_errors.invalid_format") }}
      </div>
      <label class="form-label mt-2 mb-1">{{ $t("poll_style") }}</label>
      <div
        class="d-flex align-items-stretch justify-content-center poll-styles-list"
      >
        <div
          @click="editedPoll.style = style"
          class="btn btn-outline-light mx-2 poll-style-button"
          :class="{ ['poll-style-' + style]: true }"
          v-for="style in range(pollStylesCount)"
          :key="style"
          :checked="editedPoll.style == style"
        ></div>
      </div>
    </div>
    <div v-else>
      <div class="poll-name">
        {{ poll.name }}
      </div>
      <div class="fs-7 opacity-75 mb-3">
        <span v-if="poll.maxChosenOptionsCount > 1">
          {{ $tc("poll_max_chosen_options_count", poll.maxChosenOptionsCount) }}
        </span>
      </div>

      <div
        class="form-check user-select-none d-flex align-items-center poll-option"
        v-for="(option, index) in poll.options"
        :key="index"
      >
        <div
          class="poll-option-progressbar"
          :style="{
            width:
              (showResults && pollResultsSum > 0
                ? (poll.results[index] / pollResultsSum) * 100
                : 0) + '%',
          }"
        ></div>
        <input
          @click="onInputChange"
          class="form-check-input poll-option-input"
          :type="poll.maxChosenOptionsCount == 1 ? 'radio' : 'checkbox'"
          :id="getOptionHTMLId(index)"
          :name="getOptionInputName()"
        />
        <label
          class="form-check-label flex-grow-1"
          :for="getOptionHTMLId(index)"
        >
          {{ option }}
        </label>

        <div
          class="fs-7 poll-option-results"
          v-if="showResults && pollResultsSum > 0"
        >
          {{ Math.floor((poll.results[index] / pollResultsSum) * 100) }}%
        </div>
      </div>

      <div class="fs-7 mt-2" v-if="showResults && pollResultsSum > 0">
        {{ $t("poll_answers_count", { answersCount: poll.answersCount }) }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "~bootstrap/scss/functions";
@import "~bootstrap/scss/variables";
@import "../scss/variables";

$poll-option-border-radius: 0.5rem;
$foreground-color: rgb(255, 255, 255);
$foreground-color-transparent: rgba($foreground-color, 0.4);

.poll-container {
  position: relative;
  color: $foreground-color;
  background-color: rgb(253, 253, 253);
  max-width: 380px;
  margin: auto;
  padding: $spacer * 0.5 $spacer * 0.75;
  border-radius: 0.75rem;
  margin-top: $spacer * 2;

  input[type="text"],
  input[type="number"] {
    text-align: center;
    background-color: unset;
    color: $foreground-color;
    border-color: $foreground-color;
    border-radius: 0.5rem;

    &:focus {
      box-shadow: 0 0 0 0.2rem $foreground-color-transparent;
    }
  }
}

.was-validated input[type="text"],
.was-validated input[type="number"] {
  &:invalid {
    border-color: $form-feedback-invalid-color;

    &:focus {
      box-shadow: 0 0 0 0.2rem rgba($form-feedback-invalid-color, 0.4);
    }
  }

  &:valid {
    border-color: inherit;
    background: unset;
    padding: inherit;
  }
}

.poll-name {
  font-size: $font-size-base * 1.2;
}

.poll-option {
  position: relative;
  border: 1px solid $foreground-color;
  border-radius: $poll-option-border-radius;
  padding: $spacer * 0.125 $spacer * 0.35;
  margin: $spacer * 0.25 0;

  .form-check-label {
    z-index: 1;
  }
  .poll-option-input {
    background-color: unset;
    border-color: $foreground-color;
    margin-top: 0;
    margin-left: 0;
    z-index: 1;
  }
  .poll-option-input[type="checkbox"] {
    transition: box-shadow 0.3s;
    border-width: 2px;

    &:focus {
      box-shadow: 0 0 0 0.15rem $foreground-color-transparent;
    }
    &:hover {
      box-shadow: 0 0 0 0.2rem $foreground-color-transparent;
    }
    &:checked {
      background-image: escape-svg(
        url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><path fill='none' stroke='#{$foreground-color}' stroke-linecap='round' stroke-linejoin='round' stroke-width='3.5' d='M6 10l3 3l6-6'/></svg>")
      );
    }
  }
  .poll-option-input[type="radio"] {
    background-image: escape-svg(
      url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'><circle r='2' fill='#{$foreground-color}'/></svg>")
    );
    background-size: 0;
    border-width: 2px;
    transition: box-shadow 0.3s, background-size 0.2s;

    &:focus {
      box-shadow: 0 0 0 0.15rem $foreground-color-transparent;
    }
    &:hover {
      box-shadow: 0 0 0 0.25rem $foreground-color-transparent;
    }
    &:checked {
      background-size: 100%;
    }
  }
}

.poll-option-progressbar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: $poll-option-border-radius;
  background-color: $foreground-color-transparent;
  z-index: 0;
  transition: width 0.4s ease;
}

.poll-option-results {
  position: absolute;
  top: 50%;
  right: $spacer * 0.5;
  transform: translateY(-50%);
  line-height: 1;
}

.was-validated + .invalid-feedback {
  display: block;
}

.poll-add-option-button {
  width: auto;
  padding: 0 $spacer * 0.25;
}

.poll-remove-option-button {
  width: auto;
  padding: 0;
  border-radius: $poll-option-border-radius;
}

.poll-styles-list {
  height: 24px;
}

.poll-style-button {
  width: 24px;
  padding: 0;
  border: 0;

  &:focus {
    box-shadow: unset;
  }
  &:hover {
    box-shadow: 0 0 0 0.15rem $foreground-color-transparent;
  }
  &[checked="true"] {
    box-shadow: 0 0 0 0.2rem $foreground-color-transparent;
  }
}

.post-delete-button {
  position: absolute;
  top: $spacer * 0.75;
  right: $spacer;
  font-size: $font-size-base * 1.2;
}

.poll-style-0 {
  background: linear-gradient(rgb(22, 154, 179), rgb(0, 230, 119));
}

.poll-style-1 {
  background: linear-gradient(rgb(22, 82, 179), rgb(115, 0, 230));
}

.poll-style-2 {
  background: linear-gradient(rgb(204, 204, 25), rgb(230, 130, 0));
}

.poll-style-3 {
  background: linear-gradient(rgb(119, 0, 255), rgb(78, 58, 167));
}

.poll-style-4 {
  background: linear-gradient(rgb(230, 0, 0), rgb(179, 22, 99));
}

.poll-style-5 {
  background: linear-gradient(rgb(146, 0, 230), rgb(179, 22, 139));
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import type { PropType } from "vue";
import { findSum } from "@/utils";
import Poll from "@/models/poll";

const pollStylesCount = 6;

export default defineComponent({
  name: "PollElement",
  props: {
    poll: {
      type: Object as PropType<Poll>,
      required: true,
    },
    isEditor: {
      type: Boolean,
      default: false,
    },
    showResults: {
      type: Boolean,
      default: false,
    },
    initialOptionChoices: {
      type: Array as PropType<Array<number>>,
      default: () => [],
    },
  },
  emits: ["update", "delete", "optionChoicesChanged"],
  methods: {
    validate(): boolean {
      if (!this.isEditor) {
        return true;
      }

      let result = true;

      const inputs = (this.$refs.pollContainer as HTMLElement).querySelectorAll(
        "input"
      );
      for (let input of inputs) {
        if (!input.checkValidity()) {
          result = false;
          input.parentElement?.classList.add("was-validated");
          this.wasEditorOptionValidated = true;
        }
      }

      return result;
    },
    addOption() {
      if (!this.isEditor) {
        return;
      }

      const options = this.$refs.options as Array<HTMLElement> | undefined;
      if (options && options.length > 0) {
        const lastOption = options[options.length - 1];

        if (!lastOption.querySelector("input")?.checkValidity()) {
          lastOption.classList.add("was-validated");
          return;
        }
        for (let option of options) {
          option.classList.remove("was-validated");
        }
      }

      this.editedPoll?.options.push("");
    },
    onEditorInput(event: Event) {
      if (event.target) {
        const parentClasses = (event.target as HTMLElement).parentElement
          ?.classList;
        if (parentClasses) {
          parentClasses.remove("was-validated");
        }
        this.wasEditorOptionValidated = false;
      }
    },
    getOptionHTMLId(optionIndex: number) {
      return "poll-" + this.poll.id + "-option-" + optionIndex;
    },
    getOptionInputName() {
      return "poll-" + this.poll.id + "-input";
    },
    onInputChange(event: Event) {
      const currentInput = event.target as HTMLInputElement;
      if (
        currentInput.checked &&
        this.poll.maxChosenOptionsCount > 1 && // Not a radiobutton
        this.optionChoices.length >= this.poll.maxChosenOptionsCount
      ) {
        event.preventDefault();
        return;
      }

      const newOptionChoices = [];
      for (let i = 0; i < this.poll.options.length; i++) {
        const optionInput = document.getElementById(
          this.getOptionHTMLId(i)
        ) as HTMLInputElement;
        if (optionInput.checked) {
          newOptionChoices.push(i);
        }
      }

      this.optionChoices = newOptionChoices;
      this.$emit("optionChoicesChanged", newOptionChoices);
    },
    updateOptionsInputsValue() {
      if (this.isEditor) {
        return;
      }

      for (let i = 0; i < this.poll.options.length; i++) {
        const optionInput = document.getElementById(
          this.getOptionHTMLId(i)
        ) as HTMLInputElement;
        optionInput.checked = false;
      }

      for (let option of this.optionChoices) {
        const optionInput = document.getElementById(
          this.getOptionHTMLId(option)
        ) as HTMLInputElement;
        optionInput.checked = true;
      }
    },
  },
  mounted() {
    this.updateOptionsInputsValue();
  },
  data() {
    let editedPoll: Poll | undefined;
    if (this.isEditor) {
      editedPoll = Object.assign(new Poll(), this.poll);
      editedPoll.options = [];
      this.poll.options.forEach((option) => {
        editedPoll?.options.push(option);
      });
    }

    return {
      optionChoices: this.initialOptionChoices.slice(),
      wasEditorOptionValidated: false,
      editedPoll,
      pollStylesCount,
    };
  },
  computed: {
    pollNameInputId() {
      return "poll-" + this.poll.id + "-name-input";
    },
    pollResultsSum() {
      return findSum(this.poll.results);
    },
  },
  watch: {
    editedPoll: {
      handler(poll) {
        this.$emit("update", poll);
      },
      deep: true,
    },
    optionChoices() {
      this.updateOptionsInputsValue();
    },
    initialOptionChoices: {
      handler(optionChoices) {
        this.optionChoices = optionChoices;
      },
      deep: true,
    },
  },
});
</script>
