(() => {
  "use strict";

  const forms = document.querySelectorAll(".needs-validation");

  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault(); // stop form submit
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false
    );
  });
})();
