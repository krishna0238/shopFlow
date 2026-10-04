import { prisma } from "@/lib/prisma";
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

    return prisma.category.create({
      data: {
        businessId: input.businessId,
        name: input.name,
      },
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