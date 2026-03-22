import assert from "node:assert/strict";
import { factsToOverlayHints, mergeModifications } from "../lib/modifications";

const merged = mergeModifications(
  { a: "1", nested: { x: 1 } },
  { b: "2", a: "override" },
);
assert.equal(merged.a, "override");
assert.equal(merged.b, "2");
assert.equal(merged.nested, '{"x":1}');

const hints = factsToOverlayHints(
  [
    {
      category: "contact",
      key: "phone",
      content: "(414) 312-5213",
      campaignProfiles: ["nate_landing"],
    },
    {
      category: "contact",
      key: "phone",
      content: "(414) 795-4804",
      campaignProfiles: ["corporate"],
    },
  ],
  "nate_landing",
);
assert.equal(hints.phone, "(414) 312-5213");

console.log("assert-modifications: ok");
