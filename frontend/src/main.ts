import { createApp } from "vue";
import { BootstrapIconsPlugin } from "bootstrap-icons-vue";
import App from "./App.vue";
import router from "./router";
import i18n from "./i18n";
import auth from "./auth";
import { range } from "./utils";
import HeaderElement from "./components/HeaderElement.vue";
import FooterElement from "./components/FooterElement.vue";
import ModalDialog from "./components/ModalDialog.vue";

const app = createApp(App);

app.use(router);
app.use(i18n);
app.use(BootstrapIconsPlugin);
app.config.globalProperties.auth = auth;
app.config.globalProperties.range = range;

app.component("HeaderElement", HeaderElement);
app.component("FooterElement", FooterElement);
app.component("ModalDialog", ModalDialog);

app.mount("#app");
