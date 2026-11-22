"use strict";

// Vuex hoiab postitusi ja like'ide arvu
const store = Vuex.createStore({
  state: () => ({ posts: [], error: "" }),

  mutations: {
    setPosts(state, posts) {
      state.posts = posts.map(p => ({ ...p, likes: 0 }));
    },
    like(state, id) {
      const post = state.posts.find(p => p.id === id);
      if (post) post.likes++;
    },
    reset(state) {
      state.posts.forEach(p => p.likes = 0);
    },
    setError(state, message) {
      state.error = message;
    }
  },

  actions: {
    async load({ state, commit }) {
      if (state.posts.length) return;
      try {
        const response = await fetch("./posts.json");
        if (!response.ok) throw new Error("Cannot load JSON");
        const posts = await response.json();
        if (!Array.isArray(posts) || posts.length < 10)
          throw new Error("At least 10 posts required");
        commit("setPosts", posts);
      } catch (error) {
        console.error(error);
        commit("setError", "Posts could not be loaded.");
      }
    }
  }
});

// Header component
const Header = {
  template: `
    <header class="site-header">
      <nav class="main-nav">
        <router-link to="/">Home</router-link>
        <router-link to="/signup">Sign up</router-link>
        <router-link to="/signup" class="profile-link">
          <img src="images/avatar.jpg" alt="Profile">
        </router-link>
      </nav>
    </header>`
};

// Footer component
const Footer = {
  template: `
    <footer class="site-footer">
      <p>© 2026 PostIt - WAD Homework 3</p>
    </footer>`
};

// Post component: võtab andmed Vuex store'ist
const Post = {
  props: ["id"],
  computed: {
    post() {
      return this.$store.state.posts.find(p => p.id === this.id);
    }
  },
  template: `
    <article v-if="post" class="post">
      <header>
        <img class="mini-avatar" src="images/avatar.jpg" alt="Avatar">
        <strong>{{ post.author }}</strong>
        <time :datetime="post.createdAt">{{ post.createdAt }}</time>
      </header>
      <img v-if="post.image" class="post-photo"
           :src="post.image" :alt="post.imageAlt">
      <p>{{ post.text }}</p>
      <div class="post-actions">
        <button class="like-button" @click="$store.commit('like', id)">
          ♡ Like
        </button>
        <span class="like-count">{{ post.likes }} likes</span>
      </div>
    </article>`
};

// Home page
const Home = {
  components: { PostCard: Post },
  computed: {
    posts() { return this.$store.state.posts; },
    error() { return this.$store.state.error; }
  },
  mounted() {
    this.$store.dispatch("load");
  },
  template: `
    <main class="page-shell">
      <section class="feed-layout">
        <aside class="side-panel"><p>PostIt</p></aside>
        <section class="posts">
          <p v-if="error">{{ error }}</p>
          <p v-else-if="!posts.length">Loading posts...</p>
          <post-card v-for="p in posts" :key="p.id" :id="p.id"></post-card>
          <button v-if="posts.length" class="primary-button reset-button"
                  @click="$store.commit('reset')">Reset likes</button>
        </section>
        <aside class="side-panel"><p>PostIt</p></aside>
      </section>
    </main>`
};

// Signup page ja parooli valideerimine
const Signup = {
  data: () => ({ email: "", password: "", tried: false, success: false }),

  computed: {
    errors() {
      const p = this.password;
      const errors = [];
      if (p.length < 8 || p.length >= 15) errors.push("8-14 characters required");
      if (!/[A-Z]/.test(p)) errors.push("At least one uppercase letter");
      if ((p.match(/[a-z]/g) || []).length < 2) errors.push("At least two lowercase letters");
      if (!/[0-9]/.test(p)) errors.push("At least one number");
      if (!/^[A-Z]/.test(p)) errors.push("Must start with an uppercase letter");
      if (!p.includes("_")) errors.push('Must contain "_"');
      return errors;
    }
  },

  methods: {
    submit() {
      this.tried = true;
      this.success = this.errors.length === 0;
    }
  },

  template: `
    <main class="page-shell centered-page">
      <section class="form-card">
        <h1>Sign up</h1>
        <form @submit.prevent="submit">
          <label class="form-field">
            <span>Email</span>
            <input type="email" v-model="email" required placeholder="Email">
          </label>
          <label class="form-field">
            <span>Password</span>
            <input type="password" v-model="password"
                   @input="success = false" placeholder="Password">
          </label>
          <div v-if="(tried || password) && errors.length" class="password-errors">
            <p>The password is not valid:</p>
            <ul><li v-for="e in errors" :key="e">{{ e }}</li></ul>
          </div>
          <section class="form-actions">
            <button class="primary-button" type="submit">Signup</button>
          </section>
          <p v-if="success" class="signup-success">
            Password is valid! (Demo only)
          </p>
        </form>
      </section>
    </main>`
};

// Vue Router ühendab kaks vaadet
const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes: [
    { path: "/", component: Home },
    { path: "/signup", component: Signup }
  ]
});

// Käivitame rakenduse
const app = Vue.createApp({});
app.component("app-header", Header);
app.component("app-footer", Footer);
app.use(store);
app.use(router);
app.mount("#app");
