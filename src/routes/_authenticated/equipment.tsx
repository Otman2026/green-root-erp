import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { ProductsByCategory } from "@/components/products/products-by-category";

export const Route = createFileRoute("/_authenticated/equipment")({
  component: () => (
    <ProductsByCategory
      slug="equipment"
      titleAr="المعدات والأدوات"
      subtitleAr="إدارة معدات وأدوات الزراعة"
      icon={Wrench}
      colorVar="equipment"
      defaultCategoryName="Equipment"
      defaultCategoryNameAr="المعدات"
    />
  ),
});
