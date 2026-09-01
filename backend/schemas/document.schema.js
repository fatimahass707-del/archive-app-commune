const { z } = require("zod");

const createDocumentSchema = z.object({
  title: z.string().min(3, "العنوان يجب أن يحتوي على 3 أحرف على الأقل").max(255, "العنوان طويل جداً"),
  category_id: z.coerce.number().min(1, "صنف الوثيقة مطلوب"),
  doc_year: z.coerce.number().min(1900, "سنة غير صالحة").max(2100, "سنة غير صالحة"),
  department: z.string().max(150, "اسم المصلحة طويل جداً").optional(),
  description: z.string().optional(),
});

const updateDocumentSchema = z.object({
  title: z.string().min(3, "العنوان يجب أن يحتوي على 3 أحرف على الأقل").max(255, "العنوان طويل جداً").optional(),
  category_id: z.coerce.number().min(1, "صنف الوثيقة مطلوب").optional(),
  doc_year: z.coerce.number().min(1900, "سنة غير صالحة").max(2100, "سنة غير صالحة").optional(),
  department: z.string().max(150, "اسم المصلحة طويل جداً").optional(),
  description: z.string().optional(),
  status: z.enum(["active", "archived"]).optional(),
});

module.exports = {
  createDocumentSchema,
  updateDocumentSchema,
};
