const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);

let siteState = {
  admissions: [],
  content: [],
  gallery: [],
  documents: []
};

/* =====================================================
   WEBSITE STATE
   ===================================================== */

const fetchState = async () => {
  const response = await fetch("/api/state", {
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      "Could not load website data"
    );
  }

  siteState = data;
  renderDynamicContent();
};

const renderDynamicContent = () => {
  const items = siteState.content || [];

  renderNews(items);
  renderEvents(items);
  renderGallery();
  renderDocuments();
};

const renderNews = (items) => {
  const newsList = document.querySelector(".news-list");

  if (!newsList) {
    return;
  }

  newsList.innerHTML = items
    .slice(0, 3)
    .map((item) => {
      const formattedDate = (item.date || "")
        .split(" ")
        .slice(0, 2)
        .join(" ");

      return `
        <li>
          <span class="date">
            ${escapeHtml(formattedDate)}
          </span>

          <div>
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.description)}</p>
          </div>
        </li>
      `;
    })
    .join("");
};

const renderEvents = (items) => {
  const eventList = document.querySelector(".event-list");

  if (!eventList) {
    return;
  }

  eventList.innerHTML = items
    .slice(0, 3)
    .map((item) => {
      const dateParts = (item.date || "24 Sep").split(" ");
      const date = dateParts[0] || "24";
      const month = dateParts[1] || "Sep";

      return `
        <div class="event-card">
          <div class="event-date">
            <strong>${escapeHtml(date)}</strong>
            <span>${escapeHtml(month)}</span>
          </div>

          <div>
            <h4>${escapeHtml(item.title)}</h4>
            <p>${escapeHtml(item.description)}</p>
          </div>
        </div>
      `;
    })
    .join("");
};

const renderGallery = () => {
  const gallery = document.querySelector(".gallery-mini-grid");

  if (!gallery) {
    return;
  }

  const galleryImages = Array.isArray(siteState.gallery)
    ? siteState.gallery
    : [];

  if (galleryImages.length === 0) {
    gallery.innerHTML = `
      <p class="gallery-empty-message">
        No gallery images are available.
      </p>
    `;

    return;
  }

  gallery.innerHTML = galleryImages
    .slice(0, 4)
    .map((source, index) => {
      return `
        "
          alt="Campus gallery image ${index + 1}"
          loading="lazy"
          decoding="async"
        >
      `;
    })
    .join("");
};

const renderDocuments = () => {
  const downloadsTable = document.querySelector(
    "#downloadsTableBody"
  );

  if (!downloadsTable) {
    return;
  }

  downloadsTable.innerHTML = (siteState.documents || [])
    .map((documentItem, index) => {
      const extension = documentItem.name
        .split(".")
        .pop()
        ?.toUpperCase() || "FILE";

      return `
        <tr>
          <td>${escapeHtml(documentItem.name)}</td>
          <td>${escapeHtml(extension)}</td>
          <td>Latest</td>
          <td>
            <button
              type="button"
              class="download-link"
              data-doc-index="${index}"
            >
              Download
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
};

fetchState().catch((error) => {
  console.error("Unable to load website state:", error);
});

/*
 * Refresh website content periodically so admin updates
 * appear on other computers without redeployment.
 */
setInterval(() => {
  fetchState().catch(() => {});
}, 10000);

/* =====================================================
   HERO SLIDER
   ===================================================== */

const slides = document.querySelectorAll(".slide");
let currentSlide = 0;

if (slides.length > 0) {
  setInterval(() => {
    slides[currentSlide].classList.remove("active");

    currentSlide = (currentSlide + 1) % slides.length;

    slides[currentSlide].classList.add("active");
  }, 4200);
}

/* =====================================================
   NAVIGATION AND DROPDOWNS
   ===================================================== */

const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");

const dropdowns = document.querySelectorAll(
  ".main-nav .dropdown"
);

/*
 * Remove stale active classes and inline display styles.
 *
 * On desktop, CSS controls dropdown visibility through
 * :hover and :focus-within.
 *
 * On mobile, JavaScript adds the active class after a click.
 */
const resetDropdowns = () => {
  dropdowns.forEach((dropdown) => {
    dropdown.classList.remove("active");

    const submenu = dropdown.querySelector(
      ":scope > .submenu"
    );

    if (submenu) {
      submenu.style.removeProperty("display");
    }
  });
};

/*
 * Run immediately when the page loads.
 * This stops dropdowns from remaining permanently open.
 */
resetDropdowns();

/* Mobile hamburger button */

if (menuToggle && header) {
  menuToggle.addEventListener("click", (event) => {
    event.stopPropagation();

    header.classList.toggle("open");

    if (!header.classList.contains("open")) {
      resetDropdowns();
    }
  });
}

/* Individual dropdown behavior */

dropdowns.forEach((dropdown) => {
  const trigger = dropdown.querySelector(":scope > a");
  const submenu = dropdown.querySelector(
    ":scope > .submenu"
  );

  if (!trigger || !submenu) {
    return;
  }

  /*
   * Remove any old inline display value.
   */
  submenu.style.removeProperty("display");

  trigger.addEventListener("click", (event) => {
    /*
     * Desktop behavior:
     *
     * Do not add active classes.
     * Do not add inline display styles.
     * Allow the anchor link to work normally.
     */
    if (window.innerWidth > 820) {
      resetDropdowns();
      return;
    }

    /*
     * Mobile behavior:
     *
     * Prevent navigation on the first click.
     * Open only the selected submenu.
     */
    event.preventDefault();
    event.stopPropagation();

    const shouldOpen =
      !dropdown.classList.contains("active");

    resetDropdowns();

    if (shouldOpen) {
      dropdown.classList.add("active");
    }
  });
});

/*
 * Close the mobile navigation and dropdowns when clicking
 * outside the navigation area.
 */
document.addEventListener("click", (event) => {
  const navigation = document.querySelector(".main-nav");

  const clickedInsideNavigation =
    navigation?.contains(event.target);

  const clickedMenuButton =
    menuToggle?.contains(event.target);

  if (!clickedInsideNavigation && !clickedMenuButton) {
    resetDropdowns();

    if (window.innerWidth <= 820) {
      header?.classList.remove("open");
    }
  }
});

/*
 * Remove mobile dropdown state when resizing to desktop.
 */
window.addEventListener("resize", () => {
  resetDropdowns();

  if (window.innerWidth > 820) {
    header?.classList.remove("open");
  }
});

/* =====================================================
   DIRECTORY TABS
   ===================================================== */

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(
      (tabButton) => {
        const isActive = tabButton === button;

        tabButton.classList.toggle(
          "active",
          isActive
        );

        tabButton.setAttribute(
          "aria-selected",
          String(isActive)
        );
      }
    );

    document.querySelectorAll(".tab-panel").forEach(
      (panel) => {
        panel.classList.toggle(
          "active",
          panel.id === button.dataset.tab
        );
      }
    );
  });
});

/* =====================================================
   ACHIEVEMENT FILTERS
   ===================================================== */

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(
      (filterButton) => {
        filterButton.classList.toggle(
          "active",
          filterButton === button
        );
      }
    );

    document.querySelectorAll(".award-card").forEach(
      (card) => {
        const selectedFilter = button.dataset.filter;

        const shouldHide =
          selectedFilter !== "all" &&
          card.dataset.category !== selectedFilter;

        card.classList.toggle(
          "hidden",
          shouldHide
        );
      }
    );
  });
});

/* =====================================================
   ANIMATED STAT COUNTERS
   ===================================================== */

const counters = document.querySelectorAll(
  "[data-count]"
);

const statsSection = document.querySelector(".stats");

if (statsSection) {
  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        counters.forEach((counter) => {
          const target = Number(
            counter.dataset.count
          );

          let currentValue = 0;

          const increment = Math.max(
            1,
            Math.ceil(target / 90)
          );

          const updateCounter = () => {
            currentValue = Math.min(
              target,
              currentValue + increment
            );

            counter.textContent =
              currentValue.toLocaleString();

            if (currentValue < target) {
              requestAnimationFrame(
                updateCounter
              );
            }
          };

          updateCounter();
        });

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

document.addEventListener("click", (event) => {
  const downloadButton = event.target.closest(
    "[data-doc-index]"
  );

  if (!downloadButton) {
    return;
  }

  const documentIndex = Number(
    downloadButton.dataset.docIndex
  );

  const documentItem =
    siteState.documents[documentIndex];

  if (!documentItem?.dataUrl) {
    alert(
      "The uploaded file content is unavailable. " +
      "Upload the document again from the admin dashboard."
    );

    return;
  }

  const downloadLink =
    document.createElement("a");

  downloadLink.href = documentItem.dataUrl;
  downloadLink.download = documentItem.name;

  document.body.appendChild(downloadLink);

  downloadLink.click();
  downloadLink.remove();
});

/* =====================================================
   ADMISSION FORM
   ===================================================== */

const admissionForm = document.querySelector(
  "#admissionForm"
);

if (admissionForm) {
  admissionForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const status = document.querySelector(
        ".form-status"
      );

      const payload = Object.fromEntries(
        new FormData(admissionForm)
      );

      if (status) {
        status.textContent = "Submitting...";
        status.style.color = "#0d5c75";
      }

      try {
        const response = await fetch(
          "/api/admissions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          }
        );

        const data = await response
          .json()
          .catch(() => ({}));

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

          status.style.color = "#2e9d63";
        }
      } catch (error) {
        if (status) {
          status.textContent =
            error.message ||
            "Submission failed. Please try again.";

          status.style.color = "#d94c4c";
        }
      }
    }
  );
}
