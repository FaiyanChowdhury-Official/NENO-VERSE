import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { categoryName, useCatalog, type Product } from "@/data/catalog";
import { PriceTag } from "./PriceTag";

export function ProductCard({ product }: { product: Product }) {
  const { productCategories } = useCatalog();
  return (
    <article className="surface-card hover-lift flex flex-col overflow-hidden">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="block overflow-hidden bg-muted"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={640}
          className="aspect-[16/10] w-full object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <span className="w-fit rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-soft-foreground">
          {categoryName(productCategories, product.categorySlug)}
        </span>
        <h3 className="text-base font-semibold text-foreground">
          <Link to="/products/$slug" params={{ slug: product.slug }} className="hover:text-primary">
            {product.name}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.shortDescription}</p>
        <PriceTag price={product.price} {...(product.originalPrice !== undefined && { originalPrice: product.originalPrice })} className="mt-auto pt-2" />
        <Button asChild className="mt-2 w-full rounded-xl font-semibold">
          <Link to="/products/$slug" params={{ slug: product.slug }}>
            এখনই কিনুন
          </Link>
        </Button>
      </div>
    </article>
  );
}
