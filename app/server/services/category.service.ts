import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";
import type { CreateCategoryInput } from "../validation/category.validation";

export class CategoryService {
  static async createCategory(input: CreateCategoryInput) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        businessId: input.businessId,
        name: input.name,
      },
    });

    if (existingCategory) {
      throw new Error("Category already exists");
    }

    return prisma.$transaction(async (tx) => {
      const category = await tx.category.create({
        data: {
          businessId: input.businessId,
          name: input.name,
        },
      });

      await AuditService.log(
        {
          businessId: input.businessId,
          action: "CATEGORY_CREATED",
          entityType: "Category",
          entityId: category.id,
          details: {
            name: category.name,
          },
        },
        tx
      );

      return category;
    });
  }

  static async getCategories(businessId: string) {
    return prisma.category.findMany({
      where: {
        businessId,
      },
      orderBy: {
        name: "asc",
      },
    });
  }
}