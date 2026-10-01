import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check, FileDown, ShieldCheck } from "lucide-react";
import { PriceTag } from "@/components/site/PriceTag";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { categoryName, getProduct, productCategories, products } from "@/data/catalog";

export const Route = createFileRoute("/products/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "প্রোডাক্ট পাওয়া যায়নি — অক্টোপাস" }, { name: "robots", content: "noindex" }],
      };
    }
    const { product } = loaderData;
    return {
      meta: [
        { title: `${product.name} — অক্টোপাস` },
        { name: "description", content: product.shortDescription },
        { property: "og:title", content: `${product.name} — অক্টোপাস` },
        { property: "og:description", content: product.shortDescription },
      ],
    };
  },
  notFoundComponent: ProductNotFound,
  component: ProductDetail,
});

function ProductNotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-foreground">প্রোডাক্টটি পাওয়া যায়নি</h1>
      <p className="mt-3 text-muted-foreground">সম্ভবত লিংকটি পুরনো অথবা প্রোডাক্টটি সরানো হয়েছে।</p>
      <Button asChild className="mt-6 rounded-full">
        <Link to="/products">সব প্রোডাক্ট দেখুন</Link>
      </Button>
    </div>
  );
}

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const related = products.filter((p) => p.slug !== product.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-4" /> সব প্রোডাক্ট
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <img
            src={product.image}
            alt={product.name}
            width={1024}
            height={640}
            className="w-full rounded-3xl border border-border object-cover"
          />
          <span className="mt-6 inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary-soft-foreground">
            {categoryName(productCategories, product.categorySlug)}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-foreground sm:text-4xl">
            {product.name}
          </h1>
          <div className="mt-6 space-y-4 text-muted-foreground">
            {product.description.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>

          <h2 className="mt-10 text-xl font-bold text-foreground">যা যা পাচ্ছেন</h2>
          <ul className="mt-4 space-y-3">
            {product.includes.map((item) => (
              <li key={item} className="flex items-start gap-3 text-muted-foreground">
                <Check className="mt-1 size-4 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface-card p-6">
            <PriceTag price={product.price} {...(product.originalPrice !== undefined && { originalPrice: product.originalPrice })} size="lg" />
            <Button size="lg" className="mt-6 w-full rounded-xl font-semibold" asChild>
              <Link to="/checkout" search={{ type: "product", slug: product.slug }}>এখনই কিনুন</Link>
            </Button>
            <p className="mt-3 text-center text-xs text-subtle-foreground">
              কেনার জন্য অ্যাকাউন্ট প্রয়োজন
            </p>

            <dl className="mt-6 space-y-3 border-t border-border pt-6 text-sm">
              <div className="flex items-start gap-3">
                <FileDown className="mt-0.5 size-4 text-primary" />
                <div>
                  <dt className="font-medium text-foreground">ফাইল</dt>
                  <dd className="text-muted-foreground">{product.fileInfo}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 text-primary" />
                <div>
                  <dt className="font-medium text-foreground">নিরাপদ অ্যাক্সেস</dt>
                  <dd className="text-muted-foreground">
                    পেমেন্ট যাচাইয়ের পর ড্যাশবোর্ডে ডাউনলোড লিংক
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-6 rounded-xl bg-primary-soft p-4 text-sm text-primary-soft-foreground">
              পেমেন্ট মাধ্যম: বিকাশ • রকেট • ব্যাংক ট্রান্সফার
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-20">
        <h2 className="text-2xl font-bold text-foreground">আরও প্রোডাক্ট</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
