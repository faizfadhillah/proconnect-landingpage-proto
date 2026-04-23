importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBWxihJ7YAPAqmjvgLYnS4y46MapsGQZSE",
  authDomain: "proconnect-stg.firebaseapp.com",
  projectId: "proconnect-stg",
  storageBucket: "proconnect-stg.appspot.com",
  messagingSenderId: "574644263850",
  appId: "1:574644263850:web:3abda8d2cf90a7c8e4a9d3",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo.png",
    tag: "notification-" + Date.now(),
    data: payload.data,
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);

  // Send message to main app to refresh notifications
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "BACKGROUND_NOTIFICATION",
        payload: payload,
      });
    });
  });
});

// Handle notification click
self.addEventListener("notificationclick", function (event) {
  console.log("Notification clicked:", event.notification);
  event.notification.close();

  // Send message to main app
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "NOTIFICATION_CLICKED",
          data: event.notification.data,
        });
      });
    })
  );
});
