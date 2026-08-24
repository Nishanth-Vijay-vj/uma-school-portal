"use strict";

/* =====================================================
   SAFE TEXT HELPERS
   ===================================================== */

function escapeHtml(value) {
  return String(
    value === null || value === undefined
      ? ""
      : value
  ).replace(/[&<>'"]/g, function (character) {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    };

    return entities[character];
  });
}

function isValidImageSource(value) {
  if (typeof value !== "string") {
    return false;
  }

  const source = value.trim();

  if (!source) {
    return false;
  }

  const forbiddenValues = [
    "<a ",
    "</a>",
    "&lt;",
    "&gt;",
    "target=",
    "ChatInputEntity",
    " {
  const galleryContainer =
    document.querySelector(
      ".gallery-mini-grid"
    );

  if (!galleryContainer) {
    return;
  }

  galleryContainer.innerHTML = "";

  const galleryImages =
    Array.isArray(siteState.gallery)
      ? siteState.gallery.filter(
          isValidImageSource
        )
      : [];

  if (galleryImages.length === 0) {
    const emptyMessage =
      document.createElement("p");

    emptyMessage.className =
      "gallery-empty-message";

    emptyMessage.textContent =
      "No gallery images are available.";

    galleryContainer.appendChild(
      emptyMessage
    );

    return;
  }

  galleryImages
    .slice(0, 4)
    .forEach(function (source, index) {
      const image =
        document.createElement("img");

      image.src = source.trim();

      image.alt =
        "Campus gallery image " +
        String(index + 1);

      image.loading = "lazy";
      image.decoding = "async";

      image.addEventListener(
        "error",
        function () {
          console.error(
            "Gallery image failed to load:",
            source.substring(0, 100)
          );

          image.remove();
        }
      );

      galleryContainer.appendChild(image);
    });
}

/* =====================================================
   DOCUMENTS
   ===================================================== */

function renderDocuments() {
  const downloadsTable =
    document.querySelector(
      "#downloadsTableBody"
    );

  if (!downloadsTable) {
    return;
  }

  downloadsTable.innerHTML = "";

  const documents =
    Array.isArray(siteState.documents)
      ? siteState.documents
      : [];

  documents.forEach(function (
    documentItem,
    index
  ) {
    const tableRow =
      document.createElement("tr");

    const nameCell =
      document.createElement("td");

    const typeCell =
      document.createElement("td");

    const updatedCell =
      document.createElement("td");

    const downloadCell =
      document.createElement("td");

    const downloadButton =
      document.createElement("button");

    const documentName = String(
      documentItem.name || "Document"
    );

    const nameParts =
      documentName.split(".");

    const extension =
      nameParts.length > 1
        ? nameParts
            .pop()
            .toUpperCase()
        : "FILE";

    nameCell.textContent = documentName;
    typeCell.textContent = extension;
    updatedCell.textContent = "Latest";

    downloadButton.type = "button";
    downloadButton.className =
      "download-link";

    downloadButton.textContent =
      "Download";

    downloadButton.setAttribute(
      "data-doc-index",
      String(index)
    );

    downloadCell.appendChild(
      downloadButton
    );

    tableRow.appendChild(nameCell);
    tableRow.appendChild(typeCell);
    tableRow.appendChild(updatedCell);
    tableRow.appendChild(downloadCell);

    downloadsTable.appendChild(tableRow);
  });
}

/* =====================================================
   INITIAL DATA LOAD AND AUTOMATIC REFRESH
   ===================================================== */

fetchState().catch(function (error) {
  console.error(
    "Unable to load website state:",
    error
  );
});

window.setInterval(function () {
  fetchState().catch(function (error) {
    console.error(
      "Automatic website refresh failed:",
      error
    );
  });
}, 10000);

/* =====================================================
   HERO SLIDER
   ===================================================== */

const slides =
  document.querySelectorAll(".slide");

let currentSlide = 0;

if (slides.length > 0) {
  window.setInterval(function () {
    slides[currentSlide].classList.remove(
      "active"
    );

    currentSlide =
      (currentSlide + 1) %
      slides.length;

    slides[currentSlide].classList.add(
      "active"
    );
  }, 4200);
}

/* =====================================================
   NAVIGATION AND DROPDOWNS
   ===================================================== */

const header =
  document.querySelector(".site-header");

const menuToggle =
  document.querySelector(".menu-toggle");

const dropdowns =
  document.querySelectorAll(
    ".main-nav .dropdown"
  );

function getDirectChild(
  parentElement,
  selector
) {
  const children =
    parentElement.children;

  for (
    let index = 0;
    index < children.length;
    index += 1
  ) {
    if (children[index].matches(selector)) {
      return children[index];
    }
  }

  return null;
}

function resetDropdowns() {
  dropdowns.forEach(function (dropdown) {
    dropdown.classList.remove("active");

    const submenu = getDirectChild(
      dropdown,
      ".submenu"
    );

    if (submenu) {
      submenu.style.removeProperty(
        "display"
      );
    }
  });
}

resetDropdowns();

/* =====================================================
   MOBILE MENU
   ===================================================== */

if (menuToggle && header) {
  menuToggle.addEventListener(
    "click",
    function (event) {
      event.stopPropagation();

      header.classList.toggle("open");

      const menuIsOpen =
        header.classList.contains("open");

      menuToggle.setAttribute(
        "aria-expanded",
        String(menuIsOpen)
      );

      if (!menuIsOpen) {
        resetDropdowns();
      }
    }
  );
}

/* =====================================================
   DROPDOWN INTERACTION

   Desktop:
   CSS hover controls dropdown visibility.

   Mobile:
   Click controls dropdown visibility.
   ===================================================== */

dropdowns.forEach(function (dropdown) {
  const trigger = getDirectChild(
    dropdown,
    "a"
  );

  const submenu = getDirectChild(
    dropdown,
    ".submenu"
  );

  if (!trigger || !submenu) {
    return;
  }

  submenu.style.removeProperty(
    "display"
  );

  trigger.addEventListener(
    "click",
    function (event) {
      if (window.innerWidth > 820) {
        resetDropdowns();
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const shouldOpen =
        !dropdown.classList.contains(
          "active"
        );

      resetDropdowns();

      if (shouldOpen) {
        dropdown.classList.add("active");
      }
    }
  );
});

/* =====================================================
   CLOSE MOBILE MENU OUTSIDE
   ===================================================== */

document.addEventListener(
  "click",
  function (event) {
    const navigation =
      document.querySelector(".main-nav");

    const clickedInsideNavigation =
      navigation &&
      navigation.contains(event.target);

    const clickedMenuButton =
      menuToggle &&
      menuToggle.contains(event.target);

    if (
      !clickedInsideNavigation &&
      !clickedMenuButton
    ) {
      resetDropdowns();

      if (
        window.innerWidth <= 820 &&
        header
      ) {
        header.classList.remove("open");

        if (menuToggle) {
          menuToggle.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    }
  }
);

/* =====================================================
   RESET MENU AFTER SCREEN RESIZE
   ===================================================== */

window.addEventListener(
  "resize",
  function () {
    resetDropdowns();

    if (
      window.innerWidth > 820 &&
      header
    ) {
      header.classList.remove("open");

      if (menuToggle) {
        menuToggle.setAttribute(
          "aria-expanded",
          "false"
        );
      }
    }
  }
);

/* =====================================================
   DIRECTORY TABS
   ===================================================== */

document
  .querySelectorAll(".tab")
  .forEach(function (button) {
    button.addEventListener(
      "click",
      function () {
        document
          .querySelectorAll(".tab")
          .forEach(function (tabButton) {
            const isActive =
              tabButton === button;

            tabButton.classList.toggle(
              "active",
              isActive
            );

            tabButton.setAttribute(
              "aria-selected",
              String(isActive)
            );
          });

        document
          .querySelectorAll(".tab-panel")
          .forEach(function (panel) {
            panel.classList.toggle(
              "active",
              panel.id ===
                button.dataset.tab
            );
          });
      }
    );
  });

/* =====================================================
   ACHIEVEMENT FILTERS
   ===================================================== */

document
  .querySelectorAll(".filter")
  .forEach(function (button) {
    button.addEventListener(
      "click",
      function () {
        document
          .querySelectorAll(".filter")
          .forEach(function (
            filterButton
          ) {
            filterButton.classList.toggle(
              "active",
              filterButton === button
            );
          });

        const selectedFilter =
          button.dataset.filter;

        document
          .querySelectorAll(".award-card")
          .forEach(function (card) {
            const shouldHide =
              selectedFilter !== "all" &&
              card.dataset.category !==
                selectedFilter;

            card.classList.toggle(
              "hidden",
              shouldHide
            );
          });
      }
    );
  });

/* =====================================================
   ANIMATED STAT COUNTERS
   ===================================================== */

const counters =
  document.querySelectorAll(
    "[data-count]"
  );

const statsSection =
  document.querySelector(".stats");

if (
  statsSection &&
  typeof IntersectionObserver !==
    "undefined"
) {
  const counterObserver =
    new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          counters.forEach(
            function (counter) {
              const target = Number(
                counter.dataset.count
              );

              let currentValue = 0;

              const increment = Math.max(
                1,
                Math.ceil(target / 90)
              );

              function updateCounter() {
                currentValue = Math.min(
                  target,
                  currentValue + increment
                );

                counter.textContent =
                  currentValue.toLocaleString();

                if (
                  currentValue < target
                ) {
                  window.requestAnimationFrame(
                    updateCounter
                  );
                }
              }

              updateCounter();
            }
          );

          observer.disconnect();
        });
      },
      {
        threshold: 0.25
      }
    );

  counterObserver.observe(statsSection);
}

/* =====================================================
   DOCUMENT DOWNLOADS
   ===================================================== */

document.addEventListener(
  "click",
  function (event) {
    const downloadButton =
      event.target.closest(
        "[data-doc-index]"
      );

    if (!downloadButton) {
      return;
    }

    const documentIndex = Number(
      downloadButton.getAttribute(
        "data-doc-index"
      )
    );

    const documentItem =
      siteState.documents[
        documentIndex
      ];

    if (
      !documentItem ||
      !documentItem.dataUrl
    ) {
      window.alert(
        "The uploaded file content is unavailable. " +
        "Upload the document again from the admin dashboard."
      );

      return;
    }

    const downloadLink =
      document.createElement("a");

    downloadLink.href =
      documentItem.dataUrl;

    downloadLink.download =
      documentItem.name ||
      "document";

    document.body.appendChild(
      downloadLink
    );

    downloadLink.click();
    downloadLink.remove();
  }
);

/* =====================================================
   ADMISSION FORM
   ===================================================== */

const admissionForm =
  document.querySelector(
    "#admissionForm"
  );

if (admissionForm) {
  admissionForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      const status =
        document.querySelector(
          ".form-status"
        );

      const payload =
        Object.fromEntries(
          new FormData(admissionForm)
        );

      if (status) {
        status.textContent =
          "Submitting...";

        status.style.color =
          "#0d5c75";
      }

      try {
        const response = await fetch(
          "/api/admissions",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json"
            },
            body:
              JSON.stringify(payload)
          }
        );

        const data = await response
          .json()
          .catch(function () {
            return {};
          });

        if (!response.ok) {
          throw new Error(
            data.error ||
            data.message ||
            "Admission submission failed"
          );
        }

        siteState = data;

        renderDynamicContent();
        admissionForm.reset();

        if (status) {
          status.textContent =
            "Admission enquiry submitted successfully.";

          status.style.color =
            "#2e9d63";
        }
      } catch (error) {
        if (status) {
          status.textContent =
            error.message ||
            "Submission failed. Please try again.";

          status.style.color =
            "#d94c4c";
        }
      }
    }
  );
}
