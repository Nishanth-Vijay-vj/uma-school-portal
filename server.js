const express = require("express");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");

const app = express();

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const IS_VERCEL = Boolean(process.env.VERCEL);
const DATABASE_URL = process.env.DATABASE_URL;

/* =====================================================
   NEON DATABASE CONNECTION
   ===================================================== */

const pool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000
    })
  : null;

/* =====================================================
   DEFAULT WEBSITE DATA

   Gallery is intentionally empty.
   Images must be added through the admin dashboard.
   ===================================================== */

const defaultState = {
  admissions: [
    {
      student: "Arjun V",
      parent: "Vijay",
      phone: "+91 98200 12121",
      className: "Grade 9",
      date: "12 Aug 2025",
      status: "New",
      notes: "Interested in science stream",
      remarks: "Follow-up on Friday"
    },
    {
      student: "Meera P",
      parent: "Priya",
      phone: "+91 98888 43210",
      className: "Grade 7",
      date: "10 Aug 2025",
      status: "Contacted",
      notes: "Asked for campus tour",
      remarks: "Tour scheduled"
    },
    {
      student: "Nisha R",
      parent: "Raja",
      phone: "+91 90300 78912",
      className: "Grade 11",
      date: "08 Aug 2025",
      status: "Visit Scheduled",
      notes: "Documents pending",
      remarks: "Need counseling"
    },
    {
      student: "Dhruv S",
      parent: "Shankar",
      phone: "+91 90567 29081",
      className: "Grade 12",
      date: "04 Aug 2025",
      status: "Admission Confirmed",
      notes: "Fee process in progress",
      remarks: "Ready for enrollment"
    }
  ],

  content: [
    {
      title: "Science Expo 2025",
      description: "Scheduled for 24 Sep",
      date: "12 Aug 2025"
    },
    {
      title: "Holiday Notice",
      description: "Monsoon break on 15 Aug",
      date: "10 Aug 2025"
    },
    {
      title: "Parent Orientation",
      description: "Campus briefing for parents on 18 Sep",
      date: "14 Aug 2025"
    }
  ],

  gallery: [],

  documents: [
    {
      name: "Academic Calendar.pdf",
      icon: "fa-file-pdf",
      dataUrl: ""
    },
    {
      name: "Faculty Roster.docx",
      icon: "fa-file-word",
      dataUrl: ""
    },
    {
      name: "Disclosures.csv",
      icon: "fa-file-csv",
      dataUrl: ""
    }
  ]
};

/* =====================================================
   DATA HELPERS
   ===================================================== */

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function asText(value, maxLength) {
  const finalMaxLength =
    typeof maxLength === "number"
      ? maxLength
      : 500;

  return String(
    value === null || value === undefined
      ? ""
      : value
  )
    .trim()
    .slice(0, finalMaxLength);
}

/* =====================================================
   GALLERY VALIDATION
   ===================================================== */

function containsForbiddenGalleryMarkup(source) {
  const forbiddenValues = [
    "<a ",
    "</a>",
    "&lt;",
    "&gt;",
    "target=",
    "noopener",
    "ChatInputEntity",
    "<script",
    "javascript:"
  ];

  return forbiddenValues.some(function (value) {
    return source.indexOf(value) !== -1;
  });
}

function isSupportedImageDataUrl(source) {
  return (
    source.indexOf("data:image/jpeg;base64,") === 0 ||
    source.indexOf("data:image/png;base64,") === 0 ||
    source.indexOf("data:image/webp;base64,") === 0
  );
}

function isWebImageUrl(source) {
  /*
   * Uses a regular expression instead of writing a clickable URL
   * inside this source file.
   */
  return /^https?:\/\//i.test(source);
}

function isValidGallerySource(value) {
  if (typeof value !== "string") {
    return false;
  }

  const source = value.trim();

  if (!source) {
    return false;
  }

  if (containsForbiddenGalleryMarkup(source)) {
    return false;
  }

  return (
    isWebImageUrl(source) ||
    isSupportedImageDataUrl(source)
  );
}

function normalizeGallery(gallery) {
  if (!Array.isArray(gallery)) {
    return [];
  }

  return gallery
    .filter(isValidGallerySource)
    .map(function (source) {
      return source.trim();
    })
    .slice(0, 100);
}

/* =====================================================
   DOCUMENT VALIDATION
   ===================================================== */

function normalizeDocuments(documents) {
  if (!Array.isArray(documents)) {
    return clone(defaultState.documents);
  }

  return documents
    .map(function (documentItem) {
      const item = documentItem || {};

      return {
        name: asText(item.name, 180),
        icon:
          asText(item.icon, 50) ||
          "fa-file",
        dataUrl:
          typeof item.dataUrl === "string"
            ? item.dataUrl
            : ""
      };
    })
    .filter(function (documentItem) {
      return Boolean(documentItem.name);
    })
    .slice(0, 100);
}

/* =====================================================
   STATE NORMALIZATION
   ===================================================== */

function normalizeAdmissions(admissions) {
  if (!Array.isArray(admissions)) {
    return clone(defaultState.admissions);
  }

  return admissions
    .map(function (row) {
      const item = row || {};

      return {
        student: asText(item.student, 120),
        parent: asText(item.parent, 120),
        phone: asText(item.phone, 30),
        className: asText(item.className, 50),
        date: asText(item.date, 40),
        status: asText(item.status, 50),
        notes: asText(item.notes, 500),
        remarks: asText(item.remarks, 500)
      };
    })
    .slice(0, 2000);
}

function normalizeContent(content) {
  if (!Array.isArray(content)) {
    return clone(defaultState.content);
  }

  return content
    .map(function (item) {
      const contentItem = item || {};

      return {
        title: asText(contentItem.title, 160),
        description: asText(
          contentItem.description,
          1000
        ),
        date: asText(contentItem.date, 40)
      };
    })
    .filter(function (contentItem) {
      return Boolean(contentItem.title);
    })
    .slice(0, 200);
}

function normalizeState(state) {
  const safeState =
    state &&
    typeof state === "object" &&
    !Array.isArray(state)
      ? state
      : {};

  return {
    admissions: normalizeAdmissions(
      safeState.admissions
    ),

    content: normalizeContent(
      safeState.content
    ),

    gallery: normalizeGallery(
      safeState.gallery
    ),

    documents: normalizeDocuments(
      safeState.documents
    )
  };
}

/* =====================================================
   DATABASE INITIALIZATION
   ===================================================== */

let initializationPromise = null;

function ensureDatabase() {
  if (!pool) {
    return Promise.resolve(false);
  }

  if (!initializationPromise) {
    initializationPromise = initializeDatabase()
      .catch(function (error) {
        initializationPromise = null;
        throw error;
      });
  }

  return initializationPromise;
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_state (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(
    `
      INSERT INTO site_state (
        id,
        data,
        updated_at
      )
      VALUES (
        'default',
        $1::jsonb,
        NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `,
    [JSON.stringify(defaultState)]
  );

  return true;
}

/* =====================================================
   LOCAL DEVELOPMENT STORAGE
   ===================================================== */

const localFile = path.join(
  ROOT,
  "data",
  "siteData.json"
);

function readLocal() {
  try {
    const fileContents = fs.readFileSync(
      localFile,
      "utf8"
    );

    const parsedState = JSON.parse(
      fileContents
    );

    return normalizeState(parsedState);
  } catch (error) {
    return clone(defaultState);
  }
}

function writeLocal(state) {
  fs.mkdirSync(
    path.dirname(localFile),
    {
      recursive: true
    }
  );

  fs.writeFileSync(
    localFile,
    JSON.stringify(state, null, 2),
    "utf8"
  );

  return state;
}

/* =====================================================
   STORAGE OPERATIONS
   ===================================================== */

async function requireStorage() {
  if (!pool) {
    if (IS_VERCEL) {
      throw new Error(
        "DATABASE_URL is missing from this Vercel deployment"
      );
    }

    return false;
  }

  await ensureDatabase();

  return true;
}

async function readState() {
  const databaseAvailable =
    await requireStorage();

  if (!databaseAvailable) {
    return readLocal();
  }

  const result = await pool.query(`
    SELECT data
    FROM site_state
    WHERE id = 'default'
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    return clone(defaultState);
  }

  return normalizeState(
    result.rows[0].data
  );
}

async function writeState(input) {
  const normalizedState =
    normalizeState(input);

  const databaseAvailable =
    await requireStorage();

  if (!databaseAvailable) {
    return {
      state: writeLocal(normalizedState),
      updatedAt: new Date().toISOString()
    };
  }

  const result = await pool.query(
    `
      INSERT INTO site_state (
        id,
        data,
        updated_at
      )
      VALUES (
        'default',
        $1::jsonb,
        NOW()
      )
      ON CONFLICT (id)
      DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = NOW()
      RETURNING data, updated_at
    `,
    [JSON.stringify(normalizedState)]
  );

  return {
    state: normalizeState(
      result.rows[0].data
    ),
    updatedAt:
      result.rows[0].updated_at
  };
}

/* =====================================================
   EXPRESS MIDDLEWARE
   ===================================================== */

app.disable("x-powered-by");

app.use(
  express.json({
    limit: "4mb"
  })
);

app.use(function (
  request,
  response,
  next
) {
  if (
    request.path.indexOf("/api/") === 0 ||
    request.path === "/health"
  ) {
    response.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    response.set(
      "Pragma",
      "no-cache"
    );

    response.set(
      "Expires",
      "0"
    );
  }

  next();
});

app.use(
  express.static(ROOT, {
    index: false,
    maxAge: IS_VERCEL ? "1h" : 0
  })
);

/* =====================================================
   HEALTH CHECK
   ===================================================== */

app.get(
  "/health",
  async function (request, response) {
    try {
      const databaseAvailable =
        await requireStorage();

      if (databaseAvailable) {
        await pool.query("SELECT 1");
      }

      return response.json({
        ok: true,
        databaseConfigured:
          Boolean(pool),
        databaseConnected:
          Boolean(databaseAvailable),
        storage: databaseAvailable
          ? "neon-postgresql"
          : "local-json"
      });
    } catch (error) {
      console.error(
        "Health check failed:",
        error
      );

      return response.status(503).json({
        ok: false,
        databaseConfigured:
          Boolean(pool),
        databaseConnected: false,
        error: error.message
      });
    }
  }
);

/* =====================================================
   READ WEBSITE STATE
   ===================================================== */

app.get(
  "/api/state",
  async function (request, response) {
    try {
      const state = await readState();

      return response.json(state);
    } catch (error) {
      console.error(
        "Unable to read website state:",
        error
      );

      return response.status(503).json({
        message:
          "Unable to read website data",
        error: error.message
      });
    }
  }
);

/* =====================================================
   UPDATE WEBSITE STATE
   ===================================================== */

app.put(
  "/api/state",
  async function (request, response) {
    try {
      if (
        !request.body ||
        typeof request.body !== "object" ||
        Array.isArray(request.body)
      ) {
        return response.status(400).json({
          message:
            "A valid state object is required"
        });
      }

      const saved = await writeState(
        request.body
      );

      return response.json(
        saved.state
      );
    } catch (error) {
      console.error(
        "Unable to update website state:",
        error
      );

      return response.status(503).json({
        message:
          "Unable to save website data",
        error: error.message
      });
    }
  }
);

/* =====================================================
   ADMISSION ENQUIRY
   ===================================================== */

app.post(
  "/api/admissions",
  async function (request, response) {
    try {
      const body = request.body || {};

      const studentName = asText(
        body.studentName,
        120
      );

      const parentName = asText(
        body.parentName,
        120
      );

      const mobile = asText(
        body.mobile,
        30
      );

      if (
        !studentName ||
        !parentName ||
        !mobile
      ) {
        return response.status(400).json({
          message:
            "Student name, parent name and mobile number are required"
        });
      }

      const state = await readState();

      state.admissions.unshift({
        student: studentName,
        parent: parentName,
        phone: mobile,
        className: asText(
          body.classApplying,
          50
        ),
        date:
          new Intl.DateTimeFormat(
            "en-GB",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone:
                "Asia/Kolkata"
            }
          ).format(new Date()),
        status: "New",
        notes:
          asText(body.message, 500) ||
          "Submitted through the website",
        remarks: "Awaiting review"
      });

      const saved = await writeState(
        state
      );

      return response
        .status(201)
        .json(saved.state);
    } catch (error) {
      console.error(
        "Unable to save admission enquiry:",
        error
      );

      return response.status(503).json({
        message:
          "Unable to save admission enquiry",
        error: error.message
      });
    }
  }
);

/* =====================================================
   HTML ROUTES
   ===================================================== */

app.get(
  "/",
  function (request, response) {
    return response.sendFile(
      path.join(ROOT, "index.html")
    );
  }
);

app.get(
  ["/admin", "/admin.html"],
  function (request, response) {
    return response.sendFile(
      path.join(ROOT, "admin.html")
    );
  }
);

/* =====================================================
   NOT FOUND
   ===================================================== */

app.use(function (
  request,
  response
) {
  return response
    .status(404)
    .send("Not found");
});

/* =====================================================
   LOCAL SERVER
   ===================================================== */

if (require.main === module) {
  app.listen(PORT, function () {
    console.log(
      "UMA portal is running on port " +
      PORT
    );
  });
}

module.exports = app;
