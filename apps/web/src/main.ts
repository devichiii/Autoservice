import { createPinia } from "pinia";
import { createApp } from "vue";
import App from "./App.vue";
import router from "./app/router";
import "./shared/styles.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount("#app");
