<template>
  <header-element />
  <main class="position-relative">
    <h2>{{ $t("profile_view.title") }}</h2>
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
        <div
          class="post-container shadow-sm mb-3 d-flex flex-wrap justify-content-center align-items-center px-3 py-2"
          v-for="(post, index) in posts"
          :key="index"
        >
          <router-link
            class="post-title text-decoration-none text-reset"
            :to="'/post/' + post.id"
          >
            <h5 class="m-0">{{ post.title }}</h5>
            <span class="fs-7">
              {{ $t("created_on") }}: {{ $d(post.creationDate, "short") }}
            </span>
          </router-link>
          <div
            class="post-edits d-flex flex-wrap justify-content-center align-items-center"
          >
            <button
              class="btn btn-primary publishing-state-toggle flex-wrap"
              @click="togglePostPublishingState(index)"
            >
              <span
                class="spinner-border spinner-border-sm"
                v-if="togglingPublishStatePostIndex == index"
              ></span>
              <span v-else-if="!post.isPublished">{{ $t("publish") }}</span>
              <span v-else>{{ $t("unpublish") }}</span>
            </button>
            <div>
              <button class="btn btn-primary icon-btn" @click="editPost(post)">
                <b-icon-pencil />
              </button>
              <button
                class="btn btn-primary icon-btn ms-2"
                @click="copyPostLink(post)"
                :disabled="!post.isPublished"
              >
                <b-icon-link />
              </button>
              <button
                class="btn btn-danger icon-btn ms-2"
                @click="deletePost(post)"
              >
                <b-icon-trash />
              </button>
            </div>
          </div>
        </div>
        <div v-if="posts.length == 0">
          <div
            class="alert alert-warning mx-3 px-3 py-2 d-inline-flex align-items-center justify-content-center"
          >
            <b-icon-info-circle class="me-2" />
            <div>{{ $t("profile_view.empty_posts_list") }}</div>
          </div>
        </div>
        <button
          class="btn btn-primary icon-btn px-2 py-1"
          @click="createNewPost()"
        >
          <b-icon-plus />
        </button>
      </div>
    </Transition>
  </main>
  <footer-element />

  <modal-dialog
    ref="copyLinkModal"
    :title="$t('profile_view.copy_post_link')"
    :buttons="[{ type: ModalButtonType.Primary, text: $t('close') }]"
    @buttonClick="copyLinkModal.isShowed = false"
  >
    <div class="text-start">{{ $t("profile_view.copy_link_description") }}</div>
    <div class="text-center d-block mt-2">
      <span
        class="d-inline-block overflow-auto text-nowrap user-select-all border rounded px-2 py-1"
        style="max-width: 100%"
      >
        {{ currentPollLink }}
      </span>
    </div>
  </modal-dialog>
  <modal-dialog
    ref="deletePostModal"
    :title="$t('profile_view.delete_post_modal_title')"
    :buttons="[
      { type: ModalButtonType.Primary, text: $t('no') },
      { type: ModalButtonType.Secondary, text: $t('yes') },
    ]"
    @buttonClick="deletePostModalClick"
  >
    {{
      $t("profile_view.delete_post_modal_description", {
        pollName: deletingPost?.title || "",
      })
    }}
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
@import "~bootstrap/scss/functions";
@import "~bootstrap/scss/variables";
@import "../scss/variables";

.post-container {
  border-radius: 1rem;
  background-color: rgb(253, 253, 253);
  row-gap: $spacer * 0.5;
}

.post-title {
  text-align: left;
  margin-right: auto;

  @media (max-width: $main-width) {
    width: 100%;
    text-align: center;
    margin-right: unset;
  }
}

.post-edits {
  column-gap: $spacer * 0.5;
  row-gap: $spacer * 0.5;
  @media (max-width: $main-width) {
    width: 100%;
  }
}

.publishing-state-toggle {
  min-width: 180px;
}
</style>

<script lang="ts">
import { defineComponent } from "vue";
import { ErrorTypes } from "open-polls";
import { getErrorTitleKey, getErrorDescriptionKey } from "../utils";
import Post from "../models/post";
import { ModalButtonType } from "../types";
import ModalDialog from "../components/ModalDialog.vue";

export default defineComponent({
  name: "ProfileView",
  data() {
    return {
      isPageLoading: true,
      togglingPublishStatePostIndex: -1,
      currentPollLink: "",
      errorTitle: "",
      errorDescription: "",
      posts: new Array<Post>(),
      deletingPost: null as Post | null,
      ModalButtonType,
    };
  },
  computed: {
    copyLinkModal(): typeof ModalDialog {
      return this.$refs.copyLinkModal as typeof ModalDialog;
    },
    deletePostModal(): typeof ModalDialog {
      return this.$refs.deletePostModal as typeof ModalDialog;
    },
    errorModal(): typeof ModalDialog {
      return this.$refs.errorModal as typeof ModalDialog;
    },
  },
  created() {
    this.fetchMyPosts();
  },
  methods: {
    async fetchMyPosts() {
      this.isPageLoading = true;
      try {
        const result = await fetch("/api/my_posts/");
        const json = await result.json();
        if (!result.ok) {
          this.errorTitle = this.$t(getErrorTitleKey(json.errorCode));
          this.errorDescription = this.$t(
            getErrorDescriptionKey(json.errorCode)
          );
          this.errorModal.isShowed = true;
          return;
        }

        this.posts = json.posts;
        this.isPageLoading = false;
      } catch (error) {
        console.error(error);

        this.errorTitle = this.$t("errors.unknown_error_title");
        this.errorDescription = this.$t("errors.unknown_error_description");
        this.errorModal.isShowed = true;
      }
    },
    createNewPost() {
      this.$router.push("/post_edit/");
    },
    async togglePostPublishingState(postIndex: number) {
      if (this.togglingPublishStatePostIndex != -1) {
        return;
      }
      this.togglingPublishStatePostIndex = postIndex;

      const post = this.posts[postIndex];

      try {
        const response = await fetch(
          `/api/set_post_publishing_state?id=${
            post.id
          }&is_published=${!post.isPublished}`
        );
        const json = await response.json();
        if (response.ok) {
          post.isPublished = !post.isPublished;
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
        console.error(error);

        this.errorTitle = this.$t("errors.unknown_error_title");
        this.errorDescription = this.$t("errors.unknown_error_description");
        this.errorModal.isShowed = true;
      } finally {
        this.togglingPublishStatePostIndex = -1;
      }
    },
    editPost(post: Post) {
      this.$router.push(`/post_edit/${post.id}`);
    },
    deletePost(post: Post) {
      this.deletingPost = post;
      this.deletePostModal.isShowed = true;
    },
    copyPostLink(post: Post) {
      this.currentPollLink = new URL(
        `/post/${post.id}`,
        window.location.origin
      ).href;
      this.copyLinkModal.isShowed = true;
    },
    async deletePostModalClick(buttonIndex: number) {
      if (buttonIndex != 1 || this.isPageLoading) {
        // Not a Yes button
        this.deletePostModal.isShowed = false;
        return;
      }

      this.isPageLoading = true;

      try {
        const response = await fetch(`/api/post?id=${this.deletingPost?.id}`, {
          method: "DELETE",
        });
        const json = await response.json();
        if (!response.ok) {
          this.errorTitle = this.$t(
            getErrorTitleKey(json.errorCode || ErrorTypes.UNKNOWN_ERROR)
          );
          this.errorDescription = this.$t(
            getErrorDescriptionKey(json.errorCode || ErrorTypes.UNKNOWN_ERROR)
          );
          this.errorModal.isShowed = true;
        }
        this.fetchMyPosts();
      } catch (error) {
        console.error(error);

        this.errorTitle = this.$t("errors.unknown_error_title");
        this.errorDescription = this.$t("errors.unknown_error_description");
        this.errorModal.isShowed = true;
      } finally {
        this.isPageLoading = false;
        this.deletePostModal.isShowed = false;
      }
    },
  },
});
</script>
