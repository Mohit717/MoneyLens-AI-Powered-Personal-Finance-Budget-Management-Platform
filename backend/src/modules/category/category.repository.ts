import { PrismaClient, Category, CategoryType } from "../../generated/prisma/client.js";
import { CreateCategoryInput, UpdateCategoryInput } from "./category.schema.js";
import { PRESET_CATEGORIES } from "./category.presets.js";

export class CategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async seedPresetsIfEmpty(): Promise<void> {
    const presetCount = await this.prisma.category.count({
      where: { isPreset: true },
    });

    if (presetCount > 0) return;

    for (const preset of PRESET_CATEGORIES) {
      const parent = await this.prisma.category.create({
        data: {
          name: preset.name,
          type: preset.type as CategoryType,
          icon: preset.icon,
          color: preset.color,
          isPreset: true,
          userId: null,
        },
      });

      if (preset.subcategories && preset.subcategories.length > 0) {
        for (const sub of preset.subcategories) {
          await this.prisma.category.create({
            data: {
              name: sub.name,
              type: preset.type as CategoryType,
              icon: sub.icon,
              color: sub.color,
              parentId: parent.id,
              isPreset: true,
              userId: null,
            },
          });
        }
      }
    }
  }

  async findAll(userId: string, type?: CategoryType): Promise<Category[]> {
    await this.seedPresetsIfEmpty();

    return this.prisma.category.findMany({
      where: {
        AND: [
          {
            OR: [
              { userId },
              { isPreset: true },
              { userId: null },
            ],
          },
          ...(type ? [{ type }] : []),
        ],
      },
      include: {
        subcategories: true,
      },
      orderBy: [{ isPreset: "desc" }, { name: "asc" }],
    });
  }

  async findById(id: string): Promise<(Category & { subcategories?: Category[] }) | null> {
    return this.prisma.category.findUnique({
      where: { id },
      include: { subcategories: true },
    });
  }

  async findByNameAndUser(name: string, userId: string): Promise<Category | null> {
    return this.prisma.category.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        OR: [{ userId }, { isPreset: true }],
      },
    });
  }

  async create(userId: string, data: CreateCategoryInput): Promise<Category> {
    return this.prisma.category.create({
      data: {
        name: data.name,
        type: data.type as CategoryType,
        parentId: data.parentId || null,
        icon: data.icon || null,
        color: data.color || null,
        isPreset: false,
        userId,
      },
      include: {
        subcategories: true,
      },
    });
  }

  async update(id: string, data: UpdateCategoryInput): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
      },
      include: {
        subcategories: true,
      },
    });
  }

  async delete(id: string): Promise<Category> {
    return this.prisma.category.delete({
      where: { id },
    });
  }

  async countTransactions(categoryId: string): Promise<number> {
    return this.prisma.transaction.count({
      where: { categoryId },
    });
  }
}

