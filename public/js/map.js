// Interactive Map initialization using Leaflet.js
document.addEventListener("DOMContentLoaded", () => {
  // 1. Single Listing Detail Map
  const mapElement = document.getElementById("map");
  if (mapElement) {
    const lat = parseFloat(mapElement.getAttribute("data-lat")) || 28.6139;
    const lng = parseFloat(mapElement.getAttribute("data-lng")) || 77.2090;
    const title = mapElement.getAttribute("data-title") || "Listing Location";
    const location = mapElement.getAttribute("data-location") || "";

    const map = L.map("map", {
      center: [lat, lng],
      zoom: 12,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

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

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    marker.bindPopup(`
      <div class="map-popup-card">
        <h6 class="fw-bold mb-1">${title}</h6>
        <p class="text-muted small mb-0"><i class="fa-solid fa-location-dot me-1 text-danger"></i>${location}</p>
      </div>
    `).openPopup();
  }

  // 2. All Listings Map & Toggle Logic
  const toggleBtn = document.getElementById("toggleViewBtn");
  const gridView = document.getElementById("listings-grid-view");
  const mapView = document.getElementById("listings-map-view");
  const allMapElement = document.getElementById("allMap");

  let allMapInstance = null;

  if (toggleBtn && gridView && mapView) {
    toggleBtn.addEventListener("click", () => {
      const isMapHidden = mapView.classList.contains("d-none");

      if (isMapHidden) {
        // Show Map, Hide Grid
        mapView.classList.remove("d-none");
        gridView.classList.add("d-none");
        document.getElementById("toggleText").textContent = "Show list";
        document.getElementById("toggleIcon").className = "fa-solid fa-list-ul";

        // Initialize All Map if not already initialized
        if (!allMapInstance && allMapElement && window.allListingsData) {
          allMapInstance = L.map("allMap", {
            scrollWheelZoom: true,
          });

          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(allMapInstance);

          const bounds = [];

          window.allListingsData.forEach((listing) => {
            const coords = listing.geometry && listing.geometry.coordinates ? listing.geometry.coordinates : [77.2090, 28.6139];
            const lat = coords[1];
            const lng = coords[0];
            bounds.push([lat, lng]);

            const priceText = listing.price ? `₹${listing.price.toLocaleString("en-IN")}` : "N/A";
            
            const priceIcon = L.divIcon({
              className: "price-badge-marker",
              html: `<div class="badge-pill">${priceText}</div>`,
              iconSize: [60, 26],
              iconAnchor: [30, 13],
            });

            const popupContent = `
              <div class="map-card-popup" style="width: 180px;">
                <img src="${listing.image ? listing.image.url : 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e'}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px;" alt="${listing.title}" />
                <h6 class="fw-bold mt-2 mb-1 text-truncate" style="font-size: 0.9rem;">${listing.title}</h6>
                <p class="text-muted small mb-1">${listing.location || ''}</p>
                <div class="fw-bold text-dark mb-2">₹${listing.price ? listing.price.toLocaleString("en-IN") : 0} / night</div>
                <a href="/listings/${listing._id}" class="btn btn-sm btn-danger w-100 rounded-pill py-1">View Stay</a>
              </div>
            `;

            L.marker([lat, lng], { icon: priceIcon })
              .addTo(allMapInstance)
              .bindPopup(popupContent);
          });

          if (bounds.length > 0) {
            allMapInstance.fitBounds(bounds, { padding: [50, 50] });
          } else {
            allMapInstance.setView([28.6139, 77.2090], 5);
          }
        } else if (allMapInstance) {
          setTimeout(() => {
            allMapInstance.invalidateSize();
          }, 100);
        }
      } else {
        // Show Grid, Hide Map
        mapView.classList.add("d-none");
        gridView.classList.remove("d-none");
        document.getElementById("toggleText").textContent = "Show map";
        document.getElementById("toggleIcon").className = "fa-solid fa-map";
      }
    });
  }
});
