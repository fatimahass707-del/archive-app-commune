const request = require("supertest");
const express = require("express");
const documentsRoutes = require("../routes/documents.routes");

// 1. Mock the DB
jest.mock("../config/db", () => {
  return {
    query: jest.fn(),
  };
});
const pool = require("../config/db");

// 2. Mock the Auth Middleware
jest.mock("../middleware/auth", () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 1, role: "admin", full_name: "Test Admin" };
    next();
  },
  requireRole: (role) => (req, res, next) => next(),
}));

// 3. Mock the Space Middleware (used in controller)
jest.mock("../middleware/space.middleware", () => ({
  getUserSpaces: jest.fn().mockResolvedValue([]),
}));

// 4. Mock Logger
jest.mock("../utils/logger", () => ({
  logActivity: jest.fn(),
}));

// Setup Express App for Testing
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/documents", documentsRoutes);

describe("Documents API", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/documents", () => {
    it("should return a list of documents", async () => {
      // Setup DB mock response
      pool.query
        .mockResolvedValueOnce([
          [
            { id: 1, title: "Doc 1", category_name: "Cat A", uploaded_by_name: "Admin" },
            { id: 2, title: "Doc 2", category_name: "Cat B", uploaded_by_name: "Admin" }
          ]
        ])
        .mockResolvedValueOnce([[{ total: 2 }]]); // For the count query

      const res = await request(app).get("/api/documents");
      
      expect(res.status).toBe(200);
      expect(res.body.documents).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });
  });

  describe("POST /api/documents", () => {
    it("should create a document when validation passes", async () => {
      // Mock generateReferenceCode queries
      pool.query
        .mockResolvedValueOnce([[]]) // No existing docs for the year
        .mockResolvedValueOnce([{ insertId: 10 }]); // Insert query result

      const res = await request(app)
        .post("/api/documents")
        .send({
          title: "Test Validation Doc",
          category_id: 1,
          doc_year: 2026,
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("تمت إضافة الوثيقة بنجاح");
      expect(res.body.id).toBe(10);
    });

    it("should return 400 Bad Request when Zod validation fails (missing title)", async () => {
      const res = await request(app)
        .post("/api/documents")
        .send({
          category_id: 1,
          doc_year: 2026,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("خطأ في البيانات المدخلة");
      expect(res.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "title" })
        ])
      );
    });
  });
});
