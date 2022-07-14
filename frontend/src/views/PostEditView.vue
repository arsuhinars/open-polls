<template>
  <header-element />
  <main>
    <h2 v-if="isNewPost">{{ $t("post_edit.new_post_title") }}</h2>
    <h2 v-else>{{ $t("post_edit.title") }}</h2>
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
        <div class="mt-3" id="post-form">
          <label for="post-title-input" class="form-label">
            {{ $t("post_edit.post_title_input") }}
          </label>
          <input
            @change="hasInvalidFields = false"
            ref="postTitleInput"
            type="text"
            class="form-control form-control-lg text-center"
            id="post-title-input"
            v-model="post.title"
            maxlength="32"
            required
          />
          <div class="invalid-feedback">
            {{ $t("validation_errors.required") }}
          </div>
        </div>
        <TransitionGroup name="scale-reverse">
          <poll-element
            @update="
              (newPoll) => {
                post.polls[index] = newPoll;
                hasInvalidFields = false;
              }
            "
            @delete="deletePoll(index)"
            v-for="(poll, index) in post.polls"
            :poll="poll"
            :isEditor="true"
            :key="poll.id"
            ref="polls"
          />
        </TransitionGroup>
        <b-icon-plus
          class="btn btn-primary mx-auto mt-4 fs-2 d-block"
          id="add-button"
          @click="addPoll()"
        />
        <button @click="savePost" class="btn btn-primary mt-3">
          {{ $t("post_edit.save_post") }}
        </button>
        <input type="hidden" :class="{ 'is-invalid': hasInvalidFields }" />
        <div class="invalid-feedback">
          {{ invalidFeedbackText }}
        </div>
      </div>
    </Transition>
  </main>
  <footer-element />

  <modal-dialog
    ref="deletePollModal"
    :title="$t('post_edit.delete_poll_modal_title')"
    :buttons="[
      { type: ModalButtonType.Primary, text: $t('no') },
      { type: ModalButtonType.Secondary, text: $t('yes') },
    ]"
    @buttonClick="deletePollModalClick"
  >
    {{ $t("post_edit.delete_poll_modal_description") }}
  </modal-dialog>
  <modal-dialog
    ref="unauthorizedModal"
    :title="$t('errors.unauthorized_error_title')"
    hasCloseButton
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
    @buttonClick="errorModalClick"
  >
    {{ errorDescription }}
  </modal-dialog>
</template>

<style scoped lang="scss">
@import "~bootstrap/scss/functions";
@import "~bootstrap/scss/variables";

#post-form {
  max-width: 400px;
  margin: auto;
}

#add-button {
  width: auto;
  padding: 0 $spacer * 0.25;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import { ErrorTypes } from "open-polls";
import { getErrorDescriptionKey, getErrorTitleKey } from "@/utils";
import auth from "../auth";
import { ModalButtonType } from "../types";
import Post from "../models/post";
import Poll from "../models/poll";
import PollElement from "../components/PollElement.vue";
import ModalDialog from "../components/ModalDialog.vue";

interface PollData {
  name: string;
  style: number;
  options: Array<string>;
  maxChosenOptionsCount: number;
}

interface PostData {
  id?: number;
  title: string;
  polls: Array<PollData>;
}

export default defineComponent({
  name: "PostEditView",
  components: { PollElement },
  data() {
    const postIdString = this.$route.params.postId.toString();

    return {
      post: null as Post | null,
      isNewPost: this.$route.params.postId ? false : true,
      postId: postIdString ? parseInt(postIdString, 10) : 0,
      isPageLoading: true,
      isSavingPost: false,
      hasInvalidFields: false,
      invalidFeedbackText: "",
      deletingPollIndex: -1,
      errorTitle: "",
      errorDescription: "",
      ModalButtonType,
    };
  },
  computed: {
    deletePollModal() {
      return this.$refs.deletePollModal as typeof ModalDialog;
    },
    unauthorizedModal() {
      return this.$refs.unauthorizedModal as typeof ModalDialog;
    },
    errorModal() {
      return this.$refs.errorModal as typeof ModalDialog;
    },
  },
  created() {
    this.fetchPost();
  },
  methods: {
    async fetchPost() {
      this.isPageLoading = true;

      if (!this.isNewPost) {
        try {
          const response = await fetch(`/api/post/?id=${this.postId}`);
          const json = await response.json();
          if (response.ok) {
            this.post = json.post as Post;
            this.isPageLoading = false;
          } else {
            this.errorTitle = this.$t(
              getErrorTitleKey(json.errorCode || ErrorTypes.UNKNOWN_ERROR)
            );
            this.errorDescription = this.$t(
              getErrorDescriptionKey(json.errorCode || ErrorTypes.UNKNOWN_ERROR)
            );
            this.errorModal.isShowed = true;
          }
        } catch (error) {
          this.errorTitle = this.$t("errors.unknown_error_title");
          this.errorDescription = this.$t("errors.unknown_error_description");
          console.error(error);
          this.errorModal.isShowed = true;
        }
      } else {
        this.post = new Post();
        this.isPageLoading = false;
      }
    },
    addPoll() {
      let newPoll = new Poll();
      newPoll.name = "";
      newPoll.style = 0;
      newPoll.maxChosenOptionsCount = 1;
      newPoll.options = [];
      this.post?.polls.push(newPoll);
    },
    deletePoll(pollIndex: number) {
      this.deletingPollIndex = pollIndex;
      this.deletePollModal.isShowed = true;
    },
    validate(): boolean {
      let result = true;
      this.invalidFeedbackText = this.$t(
        "post_edit.has_invalid_fields_feedback"
      );

      let postTitleInput = this.$refs.postTitleInput as HTMLInputElement;
      if (!postTitleInput.checkValidity()) {
        postTitleInput.parentElement?.classList.add("was-validated");
        result = false;
      }

      if (this.$refs.polls) {
        for (let poll of this.$refs.polls as Array<{ validate(): boolean }>) {
          if (!poll.validate()) {
            result = false;
          }
        }
      } else {
        result = false;
        this.invalidFeedbackText = this.$t("post_edit.empty_polls_feedback");
      }

      this.hasInvalidFields = !result;
      return result;
    },
    async savePost() {
      if (!this.validate() || this.isSavingPost) {
        return;
      } else if (!auth.isAuthorized) {
        this.unauthorizedModal.isShowed = true;
        return;
      }

      this.isSavingPost = true;
      this.isPageLoading = true;

      const pollsData: Array<PollData> = [];
      this.post?.polls.forEach((poll) => {
        pollsData.push({
          name: poll.name,
          style: poll.style,
          options: poll.options,
          maxChosenOptionsCount: poll.maxChosenOptionsCount,
        });
      });

      const postData: PostData = {
        id: this.post?.id,
        title: this.post?.title ?? "",
        polls: pollsData,
      };

      const fetchOptions = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      };

      if (this.isNewPost) {
        fetchOptions.method = "POST";
      }

      try {
        const response = await fetch("/api/post", fetchOptions);
        const json = await response.json();
        if (!response.ok) {
          this.errorTitle = this.$t(
            getErrorTitleKey(json.errorCode || ErrorTypes.UNKNOWN_ERROR)
          );
          this.errorDescription = this.$t(
            getErrorDescriptionKey(json.errorCode || ErrorTypes.UNKNOWN_ERROR)
          );
          this.errorModal.isShowed = true;
        } else {
          this.isPageLoading = false;
          this.isSavingPost = false;

          if (this.isNewPost && this.post) {
            this.isNewPost = false;
            this.post.id = json.postId;
          }
        }
      } catch (error) {
        this.errorTitle = this.$t("errors.unknown_error_title");
        this.errorDescription = this.$t("errors.unknown_error_description");
        console.error(error);
        this.errorModal.isShowed = true;
      }
    },
    onUnauthorizedModalClick(buttonIndex: number) {
      switch (buttonIndex) {
        case 0: // close
          break;
        case 1: // login
          auth.login();
          break;
      }
      (this.$refs.unauthorizedModal as typeof ModalDialog).isShowed = false;
    },
    deletePollModalClick(buttonIndex: number) {
      this.deletePollModal.isShowed = false;

      if (buttonIndex != 1 || this.deletingPollIndex == -1) {
        // Not a Yes button
        return;
      }

      this.post?.polls.splice(this.deletingPollIndex, 1);
      this.deletingPollIndex = -1;
    },
    errorModalClick() {
      if (!this.isSavingPost) {
        this.$router.push("/");
      } else {
        this.isSavingPost = false;
        this.isPageLoading = false;
        this.errorModal.isShowed = false;
      }
    },
  },
});
</script>
