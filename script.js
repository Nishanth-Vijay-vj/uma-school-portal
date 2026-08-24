"use strict";

var siteState = {
  admissions: [],
  content: [],
  gallery: [],
  documents: []
};

/* =====================================================
   HELPERS
   ===================================================== */

function escapeHtml(value) {
  var text = String(
    value === null || value === undefined ? "" : value
  );

  return text.replace(/[&<>'"]/g, function (character) {
    var entities = {
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

  var source = value.trim();

  if (!source) {
    return false;
  }

  var forbiddenValues = [
    "<a ",
    "</a>",
    "&lt;",
    "&gt;",
    "target=",
    "ChatInputEntity",
    "<script",
    "javascript:"
  ];

  var containsForbiddenValue = forbiddenValues.some(
    function (forbiddenValue) {
      return source.indexOf(forbiddenValue) !== -1;
    }
  );

  if (containsForbiddenValue) {
    return false;
  }

  var isRemoteImage = /^https?:\/\//i.test(source);
  var isDataImage = source.indexOf("data:image/") === 0;

  return isRemoteImage || isDataImage;
}

/* =====================================================
   WEBSITE STATE
   ===================================================== */

async function fetchState() {
  var response = await fetch("/api/state", {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  var data = {};

  try {
    data = await response.json();
  } catch (jsonError) {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      "Could not load website data"
    );
  }

  siteState = {
    admissions: Array.isArray(data.admissions)
      ? data.admissions
      : [],
    content: Array.isArray(data.content)
      ? data.content
      : [],
    gallery: Array.isArray(data.gallery)
      ? data.gallery
      : [],
    documents: Array.isArray(data.documents)
      ? data.documents
      : []
  };

  renderDynamicContent();
}

function renderDynamicContent() {
  renderNews();
  renderEvents();
  renderGallery();
  renderDocuments();
}

/* =====================================================
   NEWS
   ===================================================== */

function renderNews() {
  var newsList = document.querySelector(".news-list");

  if (!newsList) {
    return;
  }

  newsList.innerHTML = "";

  siteState.content
    .slice(0, 3)
    .forEach(function (item) {
      var listItem = document.createElement("li");
      var dateElement = document.createElement("span");
      var contentWrapper = document.createElement("div");
      var titleElement = document.createElement("h4");
      var descriptionElement = document.createElement("p");

      var dateParts = String(item.date || "").split(" ");

      dateElement.className = "date";
      dateElement.textContent = dateParts
        .slice(0, 2)
        .join(" ");

      titleElement.textContent =
        item.title || "School update";

      descriptionElement.textContent =
        item.description || "";

      contentWrapper.appendChild(titleElement);
      contentWrapper.appendChild(descriptionElement);

      listItem.appendChild(dateElement);
      listItem.appendChild(contentWrapper);

      newsList.appendChild(listItem);
    });
}

/* =====================================================
   EVENTS
   ===================================================== */

function renderEvents() {
  var eventList = document.querySelector(".event-list");

  if (!eventList) {
    return;
  }

  eventList.innerHTML = "";

  siteState.content
    .slice(0, 3)
    .forEach(function (item) {
      var eventCard = document.createElement("div");
      var eventDate = document.createElement("div");
      var dayElement = document.createElement("strong");
      var monthElement = document.createElement("span");
      var contentWrapper = document.createElement("div");
      var titleElement = document.createElement("h4");
      var descriptionElement = document.createElement("p");

      var dateParts = String(
        item.date || "24 Sep"
      ).split(" ");

      eventCard.className = "event-card";
      eventDate.className = "event-date";

      dayElement.textContent = dateParts[0] || "24";
      monthElement.textContent = dateParts[1] || "Sep";

      titleElement.textContent =
        item.title || "School event";

      descriptionElement.textContent =
        item.description || "";

      eventDate.appendChild(dayElement);
      eventDate.appendChild(monthElement);

      contentWrapper.appendChild(titleElement);
      contentWrapper.appendChild(descriptionElement);

      eventCard.appendChild(eventDate);
      eventCard.appendChild(contentWrapper);

      eventList.appendChild(eventCard);
    });
}

/* =====================================================
   GALLERY

   This section does not use innerHTML.
   Images are created directly using the DOM.
   ===================================================== */

function renderGallery() {
  var galleryContainer = document.querySelector(
    ".gallery-mini-grid"
  );

  if (!galleryContainer) {
    return;
  }

  while (galleryContainer.firstChild) {
    galleryContainer.removeChild(
      galleryContainer.firstChild
    );
  }

  var validImages = siteState.gallery.filter(
    isValidImageSource
  );

  if (validImages.length === 0) {
    var emptyMessage = document.createElement("p");

    emptyMessage.className = "gallery-empty-message";
    emptyMessage.textContent =
      "No gallery images are available.";

    galleryContainer.appendChild(emptyMessage);
    return;
  }

  validImages
    .slice(0, 4)
    .forEach(function (source, index) {
      var image = document.createElement("img");

      image.setAttribute("src", source.trim());

      image.setAttribute(
        "alt",
        "Campus gallery image " + String(index + 1)
      );

      image.setAttribute("loading", "lazy");
      image.setAttribute("decoding", "async");

      image.addEventListener("error", function () {
        console.error(
          "Gallery image failed to load:",
          source.substring(0, 100)
        );

        image.remove();
      });

      galleryContainer.appendChild(image);
    });
}

/* =====================================================
   DOCUMENTS
   ===================================================== */

function renderDocuments() {
  var downloadsTable = document.querySelector(
    "#downloadsTableBody"
  );

  if (!downloadsTable) {
    return;
  }

  downloadsTable.innerHTML = "";

  siteState.documents.forEach(function (
    documentItem,
    index
  ) {
    var tableRow = document.createElement("tr");
    var nameCell = document.createElement("td");
    var typeCell = document.createElement("td");
    var updatedCell = document.createElement("td");
    var downloadCell = document.createElement("td");
    var downloadButton =
      document.createElement("button");

    var documentName = String(
      documentItem.name || "Document"
    );

    var nameParts = documentName.split(".");

    var extension =
      nameParts.length > 1
        ? nameParts.pop().toUpperCase()
        : "FILE";

    nameCell.textContent = documentName;
    typeCell.textContent = extension;
    updatedCell.textContent = "Latest";

    downloadButton.type = "button";
    downloadButton.className = "download-link";
    downloadButton.textContent = "Download";

    downloadButton.setAttribute(
      "data-doc-index",
      String(index)
    );

    downloadCell.appendChild(downloadButton);

    tableRow.appendChild(nameCell);
    tableRow.appendChild(typeCell);
    tableRow.appendChild(updatedCell);
    tableRow.appendChild(downloadCell);

    downloadsTable.appendChild(tableRow);
  });
}

/* =====================================================
   INITIAL LOAD AND LIVE REFRESH
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

var slides = document.querySelectorAll(".slide");
var currentSlide = 0;

if (slides.length > 0) {
  window.setInterval(function () {
    slides[currentSlide].classList.remove("active");

    currentSlide =
      (currentSlide + 1) % slides.length;

    slides[currentSlide].classList.add("active");
  }, 4200);
}

/* =====================================================
   NAVIGATION
   ===================================================== */

var header = document.querySelector(".site-header");
var menuToggle = document.querySelector(".menu-toggle");
var dropdowns = document.querySelectorAll(
  ".main-nav .dropdown"
);

function getDirectChild(parentElement, selector) {
  var children = parentElement.children;
  var index;

  for (index = 0; index < children.length; index += 1) {
    if (children[index].matches(selector)) {
      return children[index];
    }
  }

  return null;
}

function resetDropdowns() {
  dropdowns.forEach(function (dropdown) {
    var submenu;

    dropdown.classList.remove("active");

    submenu = getDirectChild(
      dropdown,
      ".submenu"
    );

    if (submenu) {
      submenu.style.removeProperty("display");
    }
  });
}

resetDropdowns();

if (menuToggle && header) {
  menuToggle.setAttribute("aria-expanded", "false");

  menuToggle.addEventListener(
    "click",
    function (event) {
      var menuIsOpen;

      event.stopPropagation();

      header.classList.toggle("open");

      menuIsOpen =
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

dropdowns.forEach(function (dropdown) {
  var trigger = getDirectChild(dropdown, "a");
  var submenu = getDirectChild(
    dropdown,
    ".submenu"
  );

  if (!trigger || !submenu) {
    return;
  }

  submenu.style.removeProperty("display");

  trigger.addEventListener(
    "click",
    function (event) {
      var shouldOpen;

      if (window.innerWidth > 820) {
        resetDropdowns();
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      shouldOpen =
        !dropdown.classList.contains("active");

      resetDropdowns();

      if (shouldOpen) {
        dropdown.classList.add("active");
      }
    }
  );
});

document.addEventListener(
  "click",
  function (event) {
    var navigation =
      document.querySelector(".main-nav");

    var clickedInsideNavigation =
      navigation &&
      navigation.contains(event.target);

    var clickedMenuButton =
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
            var isActive =
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
              panel.id === button.dataset.tab
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
        var selectedFilter =
          button.dataset.filter;

        document
          .querySelectorAll(".filter")
          .forEach(function (filterButton) {
            filterButton.classList.toggle(
              "active",
              filterButton === button
            );
          });

        document
          .querySelectorAll(".award-card")
          .forEach(function (card) {
            var shouldHide =
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
   STAT COUNTERS
   ===================================================== */

var counters = document.querySelectorAll(
  "[data-count]"
);

var statsSection =
  document.querySelector(".stats");

if (
  statsSection &&
  typeof IntersectionObserver !== "undefined"
) {
  var counterObserver =
    new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          counters.forEach(function (counter) {
            var target = Number(
              counter.dataset.count
            );

            var currentValue = 0;

            var increment = Math.max(
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

              if (currentValue < target) {
                window.requestAnimationFrame(
                  updateCounter
                );
              }
            }

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

document.addEventListener(
  "click",
  function (event) {
    var downloadButton = event.target.closest(
      "[data-doc-index]"
    );

    var documentIndex;
    var documentItem;
    var downloadLink;

    if (!downloadButton) {
      return;
    }

    documentIndex = Number(
      downloadButton.getAttribute(
        "data-doc-index"
      )
    );

    documentItem =
      siteState.documents[documentIndex];

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

    downloadLink =
      document.createElement("a");

    downloadLink.href =
      documentItem.dataUrl;

    downloadLink.download =
      documentItem.name || "document";

    document.body.appendChild(downloadLink);

    downloadLink.click();
    downloadLink.remove();
  }
);

/* =====================================================
   ADMISSION FORM
   ===================================================== */

var admissionForm = document.querySelector(
  "#admissionForm"
);

if (admissionForm) {
  admissionForm.addEventListener(
    "submit",
    async function (event) {
      var status;
      var formData;
      var payload = {};
      var response;
      var data = {};

      event.preventDefault();

      status = document.querySelector(
        ".form-status"
      );

      formData = new FormData(admissionForm);

      formData.forEach(function (value, key) {
        payload[key] = value;
      });

      if (status) {
        status.textContent = "Submitting...";
        status.style.color = "#0d5c75";
      }

      try {
        response = await fetch(
          "/api/admissions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json"
            },
            body: JSON.stringify(payload)
          }
        );

        try {
          data = await response.json();
        } catch (jsonError) {
          data = {};
        }

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
        console.error(
          "Admission form submission failed:",
          error
        );

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
