window.addEventListener("DOMContentLoaded", () => {
 const modelEntity = document.getElementById("model");
 const modelEntity2 = document.getElementById("blueSphere");
 const statusMessagesDiv = document.getElementById("status-messages");

 if (!modelEntity) {
  console.error("Fatal error: Model element with ID 'model' not found.");
  updateStatus("Error: Could not initialize the 3D model component.");
  return;
 }

 // --- Configuration ---
 // TODO: Replace with your actual target GPS coordinates
 const TARGET_LATITUDE = 35.030925; // Example: Tokyo Station
 const TARGET_LONGITUDE = 135.759688; // Example: Tokyo Station
 const VISIBILITY_RADIUS_METERS = 30; // Show model when within this many meters

 // Set the target GPS coordinates for the model entity
 modelEntity.setAttribute("gps-entity-place", `latitude: ${TARGET_LATITUDE}; longitude: ${TARGET_LONGITUDE};`);

 function updateStatus(message, clearPrevious = false) {
  console.log(message);
  if (clearPrevious) {
   statusMessagesDiv.innerHTML = message;
  } else {
   statusMessagesDiv.innerHTML += `<br>${message}`;
  }
  // Scroll to bottom
  statusMessagesDiv.scrollTop = statusMessagesDiv.scrollHeight;
 }

 function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
   Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
   Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
 }

 function checkProximityAndDisplay(position) {
  const currentLat = position.coords.latitude;
  const currentLon = position.coords.longitude;
  const accuracy = position.coords.accuracy;

  let statusText = `現在位置: Lat: ${currentLat.toFixed(6)}, Lon: ${currentLon.toFixed(6)} (Acc: ${accuracy.toFixed(
   1
  )}m)`;

  const distance = calculateDistance(currentLat, currentLon, TARGET_LATITUDE, TARGET_LONGITUDE);
  statusText += `<br>目標地点: Lat: ${TARGET_LATITUDE.toFixed(6)}, Lon: ${TARGET_LONGITUDE.toFixed(6)}`;
  statusText += `<br>目標地点との距離: ${distance.toFixed(1)} meters.`;

  if (distance < VISIBILITY_RADIUS_METERS) {
   modelEntity.setAttribute("visible", "true");
   modelEntity2.setAttribute("visible", "true");
   statusText += `<br><b>Target is nearby! Model should be visible.</b>`;
  } else {
   modelEntity.setAttribute("visible", "false");
   modelEntity2.setAttribute("visible", "false");
   statusText += `<br>目標地点から遠すぎます。 (${(distance - VISIBILITY_RADIUS_METERS).toFixed(
    0
   )}m 離れています。). 目標地点へ移動してください。`;
  }
  updateStatus(statusText, true); // Clear previous and set new status
 }

 function handleGpsError(error) {
  let message = "GPS Error: ";
  switch (error.code) {
   case error.PERMISSION_DENIED:
    message += "User denied Geolocation access.";
    break;
   case error.POSITION_UNAVAILABLE:
    message += "Location information is unavailable.";
    break;
   case error.TIMEOUT:
    message += "Geolocation request timed out.";
    break;
   default:
    message += "An unknown error occurred.";
    break;
  }
  updateStatus(message, true);
  alert(message); // Also alert for critical errors
 }

 const gpsOptions = {
  enableHighAccuracy: true,
  maximumAge: 0, // Force fresh location data
  timeout: 20000, // Time (ms) before erroring out
 };

 if (navigator.geolocation) {
  updateStatus("Requesting initial GPS location...", true);

  // Get an initial position quickly.
  navigator.geolocation.getCurrentPosition(
   (position) => {
    updateStatus("Initial GPS position obtained. AR.js will now manage updates.", true);
    checkProximityAndDisplay(position); // Initial check
   },
   (error) => {
    handleGpsError(error);
    updateStatus("Initial GPS failed. AR.js might still attempt to get location.", false);
   },
   gpsOptions
  );

  // AR.js emits 'gps-camera-update-position' when it has a new GPS position.
  // This is the preferred way to get updates when using gps-camera.
  window.addEventListener("gps-camera-update-position", (event) => {
   const positionData = {
    coords: {
     latitude: event.detail.position.latitude,
     longitude: event.detail.position.longitude,
     accuracy: event.detail.position.accuracy || 15, // Default accuracy if not provided
    },
   };
   checkProximityAndDisplay(positionData);
  });
 } else {
  const msg = "Geolocation is not supported by this browser.";
  updateStatus(msg, true);
  alert(msg);
 }

 // Listen for AR.js specific GPS events for more detailed feedback
 const sceneEl = document.querySelector("a-scene");
 sceneEl.addEventListener("loaded", () => {
  const gpsCamera = document.querySelector("a-camera[gps-camera]");
  if (gpsCamera) {
   gpsCamera.addEventListener("gps-camera-error", (event) =>
    updateStatus(`AR.js GPS System Error: ${event.detail.message || "Unknown error"}`)
   );
   gpsCamera.addEventListener("gps-camera-origin-coord-set", () => updateStatus("AR.js GPS origin set. System ready."));
  }
 });

 updateStatus("AR GPS App Initialized. Waiting for GPS signal...", true);
});
