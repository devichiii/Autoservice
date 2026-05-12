import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./app/router";
import { useAuthStore } from "./entities/auth.store";
import { setUnauthorizedHandler } from "./shared/api-client";
import "./shared/styles.css";

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(router);

  const authStore = useAuthStore(pinia);
  setUnauthorizedHandler(() => {
    authStore.clearSession();
    if (router.currentRoute.value.name !== "login") {
      router.push({ name: "login" });
    }
  });

  await authStore.hydrate();
  app.mount("#app");
}

bootstrap();
