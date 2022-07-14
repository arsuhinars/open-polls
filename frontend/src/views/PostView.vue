<template>
  <header-element />
  <main>
    <Transition name="fade">
      <div
        class="position-absolute top-50 start-50 translate-middle"
        v-if="isPageLoading"
      >
        <div class="spinner-border"></div>
      </div>
    </Transition>
    <Transition name="fade">
      <div v-if="!isPageLoading">
        <h2>{{ post.title }}</h2>
        <div class="hstack gap-1 justify-content-center" id="post-description">
          <span>{{ $t("author") }}: {{ post.author.name }}</span>
          <div class="vr"></div>
          <span>
            {{ $t("created_on") }}: {{ $d(post.creationDate, "short") }}
          </span>
        </div>
        <poll-element
          @optionChoicesChanged="
            (optionChoices) => onOptionChoicesChanged(index, optionChoices)
          "
          ref="polls"
          v-for="(poll, index) in post.polls"
          :poll="poll"
          :key="index"
          :showResults="pollsData[index]?.optionChoices.length > 0 ?? false"
          :initialOptionChoices="pollsData[index]?.optionChoices ?? []"
        />
      </div>
    </Transition>
  </main>
  <footer-element />

  <modal-dialog
    ref="unauthorizedModal"
    :title="$t('errors.unauthorized_error_title')"
    :buttons="[
      { type: ModalButtonType.Secondary, text: $t('close') },
      { type: ModalButtonType.Primary, text: $t('login') },
    ]"
    @buttonClick="onUnauthorizedModalClick"
  >
    {{ $t("errors.unauthorized_error_description") }}
  </modal-dialog>
  <modal-dialog
    ref="errorModal"
    :title="errorTitle"
    :buttons="[{ type: ModalButtonType.Primary, text: $t('ok') }]"
    :hasCloseButton="false"
    @buttonClick="errorModal.isShowed = false"
  >
    {{ errorDescription }}
  </modal-dialog>
</template>

<style scoped lang="scss">
#post-description {
  font-size: 0.9rem;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import { ErrorTypes } from "open-polls";
import auth from "@/auth";
import { getErrorTitleKey, getErrorDescriptionKey } from "../utils";
import { ModalButtonType } from "../types";
import ModalDialog from "../components/ModalDialog.vue";
import PollElement from "../components/PollElement.vue";
import Post from "@/models/post";
import PollOptionChoice from "@/models/pollOptionChoice";

interface PollData {
  optionChoices: Array<number>;
}

export default defineComponent({
  name: "PostView",
  components: { PollElement },
  data() {
    const postIdString = this.$route.params.postId.toString();

    return {
      isPageLoading: true,
      postId: postIdString ? parseInt(postIdString, 10) : 0,
      post: null as Post | null,
      pollsData: new Array<PollData>(),
      errorTitle: "",
      errorDescription: "",
      ModalButtonType,
    };
  },
  computed: {
    unauthorizedModal(): typeof ModalDialog {
      return this.$refs.unauthorizedModal as typeof ModalDialog;
    },
    errorModal(): typeof ModalDialog {
      return this.$refs.errorModal as typeof ModalDialog;
    },
    pollsElements(): Array<typeof PollElement> {
      return this.$refs.polls as Array<typeof PollElement>;
    },
  },
  methods: {
    async fetchPost() {
      this.isPageLoading = true;

      try {
        const response = await fetch(`/api/post/?id=${this.postId}`);
        const json = await response.json();
        if (!response.ok) {
          this.handleError(json.errorCode || ErrorTypes.UNKNOWN_ERROR);
          return;
        }

        this.post = json.post as Post;

        for (let i = 0; i < this.post.polls.length; i++) {
          this.pollsData.push({ optionChoices: [] });
        }

        await this.fetchPostOptionsChoices();

        document.title = this.post.title;

        this.isPageLoading = false;
      } catch (error) {
        this.handleError(ErrorTypes.UNKNOWN_ERROR);
        console.error(error);
      }
    },
    async fetchPostOptionsChoices() {
      if (!this.post || !auth.isAuthorized) {
        return;
      }

      try {
        const response = await fetch(
          `/api/post_options_choices/?post_id=${this.postId}`
        );
        const json = await response.json();
        if (!response.ok) {
          this.handleError(json.errorCode || ErrorTypes.UNKNOWN_ERROR);
          return;
        }

        const pollsIndexesMap = new Map<number, number>();
        for (let i = 0; i < this.post.polls.length; i++) {
          pollsIndexesMap.set(this.post.polls[i].id ?? 0, i);
        }

        for (let i = 0; i < this.pollsData.length; i++) {
          this.pollsData[i].optionChoices = [];
        }

        for (let optionChoice of json.postOptionsChoices as PollOptionChoice[]) {
          let pollIndex = pollsIndexesMap.get(optionChoice.pollId);
          if (pollIndex != null) {
            this.pollsData[pollIndex].optionChoices.push(
              optionChoice.optionIndex
            );
          }
        }
      } catch (error) {
        this.handleError(ErrorTypes.UNKNOWN_ERROR);
        console.log(error);
      }
    },
    async savePostOptionsChoices() {
      if (this.post == null) {
        return;
      }

      if (!auth.isAuthorized) {
        this.unauthorizedModal.isShowed = true;
        return;
      }

      const postOptionsChoices = new Array<PollOptionChoice>();
      for (let i = 0; i < this.pollsData.length; i++) {
        this.pollsData[i].optionChoices.forEach((value) => {
          postOptionsChoices.push({
            pollId: this.post?.polls[i].id ?? 0,
            optionIndex: value,
          });
        });
      }

      const fetchOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: this.post.id,
          postOptionsChoices,
        }),
      };

      try {
        const response = await fetch("/api/post_options_choices", fetchOptions);
        const json = await response.json();
        if (!response.ok) {
          this.handleError(json.errorCode || ErrorTypes.UNKNOWN_ERROR);
        }
      } catch (error) {
        this.handleError(ErrorTypes.UNKNOWN_ERROR);
        console.log(error);
      }
    },
    handleError(errorCode: ErrorTypes) {
      this.errorTitle = this.$t(getErrorTitleKey(errorCode));
      this.errorDescription = this.$t(getErrorDescriptionKey(errorCode));
      this.errorModal.isShowed = true;
    },
    onOptionChoicesChanged(pollIndex: number, optionChoices: Array<number>) {
      const oldOptionChoices = this.pollsData[pollIndex].optionChoices;
      const poll = this.post?.polls[pollIndex];
      if (poll) {
        oldOptionChoices.forEach((optionIndex) => {
          poll.results[optionIndex] -= 1;
        });
        optionChoices.forEach((optionIndex) => {
          poll.results[optionIndex] += 1;
        });

        if (oldOptionChoices.length > 0) {
          poll.answersCount -= 1;
        }
        if (optionChoices.length > 0) {
          poll.answersCount += 1;
        }
      }

      this.pollsData[pollIndex].optionChoices = optionChoices;
      this.savePostOptionsChoices();
    },
    onUnauthorizedModalClick(buttonIndex: number) {
      this.unauthorizedModal.isShowed = false;
      if (buttonIndex == 1) {
        auth.login();
      }
    },
  },
  created() {
    this.fetchPost();
  },
});
</script>
