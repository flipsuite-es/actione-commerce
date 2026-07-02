import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageBySlug } from "@/lib/data";
import Reveal from "@/components/Reveal";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = await getPageBySlug(params.slug);
  return { title: page ? `${page.title} · Oucy Studios` : "Oucy Studios" };
}

export default async function ContentPage({ params }: { params: { slug: string } }) {
  const page = await getPageBySlug(params.slug);
  if (!page) notFound();

  return (
    <div className="container-lux max-w-2xl py-16">
      <Reveal>
        <div className="hairline mx-auto" />
        <h1 className="heading mt-5 text-center text-4xl sm:text-5xl">{page.title}</h1>
        <div className="mt-8 whitespace-pre-line leading-relaxed text-ink-soft">
          {page.body}
        </div>
      </Reveal>
    </div>
  );
}
