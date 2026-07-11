import { createFileRoute } from "@tanstack/react-router";
import { SprayCan } from "lucide-react";
import { ProductsByCategory } from "@/components/products/products-by-category";

export const Route = createFileRoute("/_authenticated/pesticides")({
  component: () => (
    <ProductsByCategory
      slug="pesticides"
      titleAr="المبيدات"
      subtitleAr="إدارة المبيدات الحشرية والفطرية"
      icon={SprayCan}
      colorVar="pesticides"
      defaultCategoryName="Pesticides"
      defaultCategoryNameAr="المبيدات"
    />
  ),
});
