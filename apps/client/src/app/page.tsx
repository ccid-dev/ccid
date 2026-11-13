import type { Metadata } from "next";
import { Container } from "@repo/common";
import { JsonLd } from "@/components";
import { APP_INFO } from "@/config";
import { ROUTES } from "@/constants";
import { websiteJsonLd } from "@/libs/seo";

export const metadata: Metadata = {
  alternates: { canonical: ROUTES.home },
};

export default function Home() {
  return (
    <div className="px-5 py-12 sm:px-8 sm:py-20">
      <JsonLd data={websiteJsonLd()} />
      <Container>
        <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
          {APP_INFO.name}
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted">
          {APP_INFO.description}
        </p>
      </Container>
    </div>
  );
}
