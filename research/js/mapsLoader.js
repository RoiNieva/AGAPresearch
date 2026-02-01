let loadingPromise = null;

export function loadGoogleMaps(apiKey) {
  // already available
  if (window.google?.maps) return Promise.resolve(window.google.maps);

  // already loading
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&loading=async`;

    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps loaded but google.maps missing"));
    };

    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });

  return loadingPromise;
}
