import { createFileRoute } from "@tanstack/react-router";
import { Sprout } from "lucide-react";
import { ProductsByCategory } from "@/components/products/products-by-category";

export const Route = createFileRoute("/_authenticated/seeds")({
  component: () => (
    <ProductsByCategory
      slug="seeds"
      titleAr="البذور"
      subtitleAr="إدارة البذور والشتلات"
      icon={Sprout}
      colorVar="seeds"
      defaultCategoryName="Seeds"
      defaultCategoryNameAr="البذور"
    />
  ),
});
