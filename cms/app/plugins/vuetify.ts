// import this after install `@mdi/font` package

import { createVuetify } from "vuetify";

export default defineNuxtPlugin((app) => {
  const vuetify = createVuetify({
    // VTreeview is already included in Vuetify 3, no need to import from labs
    theme: {
      defaultTheme: 'light',
    },
    defaults: {
      VBtn: {
        style: 'font-family: "Montserrat", sans-serif;',
      },
    },
    // ... your configuration
  });
  app.vueApp.use(vuetify);
});
