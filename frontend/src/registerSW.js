// Unregister all service workers to prevent stale cache
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
        console.log('Service worker unregistered');
      });
    });
  }
}
