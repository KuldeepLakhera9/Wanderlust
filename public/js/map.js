// Interactive Map initialization using Leaflet.js
document.addEventListener("DOMContentLoaded", () => {
  const mapElement = document.getElementById("map");
  if (!mapElement) return;

  // Retrieve coordinates & listing info passed from EJS data attributes
  const lat = parseFloat(mapElement.getAttribute("data-lat")) || 28.6139;
  const lng = parseFloat(mapElement.getAttribute("data-lng")) || 77.2090;
  const title = mapElement.getAttribute("data-title") || "Listing Location";
  const location = mapElement.getAttribute("data-location") || "";

  // Initialize map centered at listing coordinates
  const map = L.map("map", {
    center: [lat, lng],
    zoom: 12,
    scrollWheelZoom: false,
  });

  // Add OpenStreetMap tile layer with attribution
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Custom marker icon design
  const customIcon = L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div class="marker-pin">
        <i class="fa-solid fa-house-user"></i>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -34],
  });

  // Add marker with popup
  const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
  
  marker.bindPopup(`
    <div class="map-popup-card">
      <h6 class="fw-bold mb-1">${title}</h6>
      <p class="text-muted small mb-0"><i class="fa-solid fa-location-dot me-1 text-danger"></i>${location}</p>
    </div>
  `).openPopup();
});
