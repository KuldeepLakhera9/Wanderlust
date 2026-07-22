// General Application Client-Side Script
(() => {
  "use strict";

  // Bootstrap Form Validation
  const forms = document.querySelectorAll(".needs-validation");
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add("was-validated");
      },
      false
    );
  });

  // Tax Display Switch Logic
  const taxSwitch = document.getElementById("switchCheckDefault");
  if (taxSwitch) {
    // Restore tax state from localStorage
    const savedTaxState = localStorage.getItem("wanderlust_show_tax");
    if (savedTaxState === "true") {
      taxSwitch.checked = true;
      toggleTaxDisplay(true);
    }

    taxSwitch.addEventListener("change", () => {
      const isChecked = taxSwitch.checked;
      localStorage.setItem("wanderlust_show_tax", isChecked);
      toggleTaxDisplay(isChecked);
    });
  }

  function toggleTaxDisplay(showTax) {
    const taxInfoList = document.querySelectorAll(".tax-info");
    const basePriceList = document.querySelectorAll(".base-price");

    taxInfoList.forEach((el) => {
      el.style.display = showTax ? "inline" : "none";
    });

    basePriceList.forEach((el) => {
      if (el.dataset.rawPrice) {
        const raw = parseFloat(el.dataset.rawPrice);
        if (!isNaN(raw)) {
          if (showTax) {
            const totalPrice = Math.round(raw * 1.18);
            el.innerHTML = `&#8377;${totalPrice.toLocaleString("en-IN")} <span class="text-muted fs-7">total</span>`;
          } else {
            el.innerHTML = `&#8377;${raw.toLocaleString("en-IN")} <span class="text-muted fs-7">/ night</span>`;
          }
        }
      }
    });
  }

  // Wishlist Heart Toggle Logic
  const wishlistButtons = document.querySelectorAll(".wishlist-btn");
  let savedWishlist = JSON.parse(localStorage.getItem("wanderlust_wishlist") || "[]");

  wishlistButtons.forEach((btn) => {
    const id = btn.dataset.id;
    const heartIcon = btn.querySelector("i");

    if (savedWishlist.includes(id)) {
      heartIcon.classList.remove("fa-regular");
      heartIcon.classList.add("fa-solid", "text-danger");
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (savedWishlist.includes(id)) {
        savedWishlist = savedWishlist.filter((itemId) => itemId !== id);
        heartIcon.classList.remove("fa-solid", "text-danger");
        heartIcon.classList.add("fa-regular");
      } else {
        savedWishlist.push(id);
        heartIcon.classList.remove("fa-regular");
        heartIcon.classList.add("fa-solid", "text-danger");
      }
      localStorage.setItem("wanderlust_wishlist", JSON.stringify(savedWishlist));
    });
  });

  // Dynamic Booking Price Calculator for Listing Detail Page
  const checkinInput = document.getElementById("checkinDate");
  const checkoutInput = document.getElementById("checkoutDate");
  const guestsInput = document.getElementById("guestCount");

  if (checkinInput && checkoutInput) {
    const today = new Date().toISOString().split("T")[0];
    checkinInput.min = today;

    // Set default check-in to today and check-out to 3 days later
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);
    const futureStr = futureDate.toISOString().split("T")[0];

    checkinInput.value = today;
    checkoutInput.min = today;
    checkoutInput.value = futureStr;

    const updateBookingCalculation = () => {
      const pricePerNight = parseFloat(document.getElementById("nightlyPrice")?.dataset?.price || "0");
      const checkin = new Date(checkinInput.value);
      const checkout = new Date(checkoutInput.value);

      if (checkout <= checkin) {
        document.getElementById("bookingSummary")?.classList.add("d-none");
        document.getElementById("bookingError")?.classList.remove("d-none");
        return;
      }

      document.getElementById("bookingError")?.classList.add("d-none");
      document.getElementById("bookingSummary")?.classList.remove("d-none");

      const diffTime = Math.abs(checkout - checkin);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

      const baseTotal = pricePerNight * diffDays;
      const gstTax = Math.round(baseTotal * 0.18);
      const cleaningFee = Math.round(pricePerNight * 0.1);
      const grandTotal = baseTotal + gstTax + cleaningFee;

      const nightCountEl = document.getElementById("calcNightCount");
      const baseSubtotalEl = document.getElementById("calcBaseSubtotal");
      const gstTaxEl = document.getElementById("calcGstTax");
      const cleaningFeeEl = document.getElementById("calcCleaningFee");
      const grandTotalEl = document.getElementById("calcGrandTotal");

      if (nightCountEl) nightCountEl.textContent = `${diffDays} night${diffDays > 1 ? "s" : ""}`;
      if (baseSubtotalEl) baseSubtotalEl.textContent = `₹${baseTotal.toLocaleString("en-IN")}`;
      if (gstTaxEl) gstTaxEl.textContent = `₹${gstTax.toLocaleString("en-IN")}`;
      if (cleaningFeeEl) cleaningFeeEl.textContent = `₹${cleaningFee.toLocaleString("en-IN")}`;
      if (grandTotalEl) grandTotalEl.textContent = `₹${grandTotal.toLocaleString("en-IN")}`;
    };

    checkinInput.addEventListener("change", () => {
      checkoutInput.min = checkinInput.value;
      if (checkoutInput.value <= checkinInput.value) {
        const nextDay = new Date(checkinInput.value);
        nextDay.setDate(nextDay.getDate() + 1);
        checkoutInput.value = nextDay.toISOString().split("T")[0];
      }
      updateBookingCalculation();
    });

    checkoutInput.addEventListener("change", updateBookingCalculation);
    if (guestsInput) guestsInput.addEventListener("change", updateBookingCalculation);

    // Initial calculation on load
    updateBookingCalculation();
  }
})();
