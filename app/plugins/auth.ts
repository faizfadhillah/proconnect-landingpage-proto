export default defineNuxtPlugin(() => {
  addRouteMiddleware("auth", () => {
    const { $firebaseAuth } = useNuxtApp();

    if (!$firebaseAuth?.currentUser?.uid) {
      //return navigateTo("/login");
    }
  });
});
