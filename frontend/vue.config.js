const { defineConfig } = require("@vue/cli-service");

module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === "production" ? "/" : "/",
  transpileDependencies: true,
  productionSourceMap: false,
  pluginOptions: {
    i18n: {
      locale: "ru",
      fallbackLocale: "en",
      localeDir: "locales",
      enableLegacy: false,
      runtimeOnly: false,
      compositionOnly: false,
      fullInstall: true,
    },
  },
  // configureWebpack: {
  //   devtool: "source-map",
  // },
});
