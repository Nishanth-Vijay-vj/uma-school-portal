const express = require("express");
const path = require("path");
const fs = require("fs");
const { Pool } = require("pg");

const app = express();

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const IS_VERCEL = Boolean(process.env.VERCEL);
const DATABASE_URL = process.env.DATABASE_URL;

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

  gallery: [
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80"
  ],

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

const clone = (value) => {
  return JSON.parse(JSON.stringify(value));
};

const asText = (value, maxLength = 500) => {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
};

const isValidGallerySource = (value) => {
  if (typeof value !== "string") {
    return false;
  }

  const source = value.trim();

  if (!source) {
    return false;
  }

  const containsInjectedHtml =
    source.includes("<a ") ||
    source.includes("</a>") ||
    source.includes("&lt;") ||
    source.includes("&gt;") ||
    source.includes('target="_blank"') ||
    source.includes("ChatInputEntity");

  if (containsInjectedHtml) {
    return false;
  }

  return (
    source.startsWith("https://") ||
    source.startsWith("http://") ||
    source.startsWith("data:image/jpeg;base64,") ||
    source.startsWith("data:image/png;base64,") ||
    source.startsWith("data:image/webp;base64,")
  );
};

const normalizeGallery = (gallery) => {
  if (!Array.isArray(gallery)) {
    return clone(defaultState.gallery);
  }

  const cleanedGallery = gallery
    .filter(isValidGallerySource)
    .map((source) => source.trim())
    .slice(0, 100);

  if (cleanedGallery.length === 0) {
    return clone(defaultState.gallery);
  }

  return cleanedGallery;
};

const normalizeState = (state) => {
  return {
    admissions: Array.isArray(state?.admissions)
      ? state.admissions
          .map((row) => ({
            student: asText(row.student, 120),
            parent: asText(row.parent, 120),
            phone: asText(row.phone, 30),
            className: asText(row.className, 50),
            date: asText(row.date, 40),
            status: asText(row.status, 50),
            notes: asText(row.notes, 500),
            remarks: asText(row.remarks, 500)
          }))
          .slice(0, 2000)
      : clone(defaultState.admissions),

    content: Array.isArray(state?.content)
      ? state.content
          .map((item) => ({
            title: asText(item.title, 160),
            description: asText(item.description, 1000),
            date: asText(item.date, 40)
          }))
          .slice(0, 200)
      : clone(defaultState.content),

    gallery: normalizeGallery(state?.gallery),

    documents: Array.isArray(state?.documents)
      ? state.documents
          .map((documentItem) => ({
            name: asText(documentItem.name, 180),
            icon: asText(documentItem.icon, 50) || "fa-file",
            dataUrl:
              typeof documentItem.dataUrl === "string"
                ? documentItem.dataUrl
                : ""
          }))
          .slice(0, 100)
      : clone(defaultState.documents)
  };
};

let initializationPromise;

const ensureDatabase = () => {
  if (!pool) {
    return Promise.resolve(false);
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
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
    })().catch((error) => {
      initializationPromise = undefined;
      throw error;
    });
  }

  return initializationPromise;
};

const localFile = path.join(
  ROOT,
  "data",
  "siteData.json"
);

const readLocal = () => {
  try {
    const fileContent = fs.readFileSync(
      localFile,
      "utf8"
    );

    return normalizeState(
      JSON.parse(fileContent)
    );
  } catch (error) {
    return clone(defaultState);
  }
};

const writeLocal = (state) => {
  fs.mkdirSync(path.dirname(localFile), {
    recursive: true
  });

  fs.writeFileSync(
    localFile,
    JSON.stringify(state, null, 2)
  );

  return state;
};

const requireStorage = async () => {
  if (!pool) {
    if (IS_VERCEL) {
      throw new Error(
        "DATABASE_URL is missing in this Vercel deployment"
      );
    }

    return false;
  }

  await ensureDatabase();
  return true;
};

const readState = async () => {
  const databaseAvailable = await requireStorage();

  if (!databaseAvailable) {
    return readLocal();
  }

  const result = await pool.query(`
    SELECT data
    FROM site_state
    WHERE id = 'default'
  `);

  const storedState =
    result.rows[0]?.data || defaultState;

  return normalizeState(storedState);
};

const writeState = async (input) => {
  const normalizedState = normalizeState(input);
  const databaseAvailable = await requireStorage();

  if (!databaseAvailable) {
    return writeLocal(normalizedState);
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
    state: normalizeState(result.rows[0].data),
    updatedAt: result.rows[0].updated_at
  };
};

app.disable("x-powered-by");

app.use(
  express.json({
    limit: "4mb"
  })
);

app.use((request, response, next) => {
  if (
    request.path.startsWith("/api/") ||
    request.path === "/health"
  ) {
    response.set(
      "Cache-Control",
      "no-store, no-cache
