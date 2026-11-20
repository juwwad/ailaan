import { test } from "node:test";
import assert from "node:assert/strict";
import { siteMetadata, SITE_TITLE, SITE_DESCRIPTION } from "../lib/metadata.js";

test("root metadata declares a canonical URL (#81)", () => {
  const metadata = siteMetadata();
  assert.equal(
    metadata.alternates?.canonical,
    "/",
    "a missing canonical lets each hostname be indexed as a separate page",
  );
});

test("root metadata sets metadataBase and the core social tags", () => {
  const metadata = siteMetadata();
  assert.ok(metadata.metadataBase instanceof URL);
  assert.equal(metadata.title, SITE_TITLE);
  assert.equal(metadata.description, SITE_DESCRIPTION);
  assert.equal(metadata.openGraph.url, "/");
  assert.equal(metadata.openGraph.title, SITE_TITLE);
  assert.equal(metadata.twitter.card, "summary_large_image");
});
