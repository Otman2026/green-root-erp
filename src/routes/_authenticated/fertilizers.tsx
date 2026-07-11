import { createFileRoute } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { ProductsByCategory } from "@/components/products/products-by-category";

export const Route = createFileRoute("/_authenticated/fertilizers")({
  component: () => (
    <ProductsByCategory
      slug="fertilizers"
      titleAr="الأسمدة"
      subtitleAr="إدارة الأسمدة العضوية والكيماوية"
      icon={Leaf}
      colorVar="fertilizers"
      defaultCategoryName="Fertilizers"
      defaultCategoryNameAr="الأسمدة"
    />
  ),
});
