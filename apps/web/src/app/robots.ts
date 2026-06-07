import { type MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/invoices/", "/api/"] },
    ],
    sitemap: "https://cleanops.yzysong.com/sitemap.xml",
  };
}
