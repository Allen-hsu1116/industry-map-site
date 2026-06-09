import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Goal 6 topic industry map renders representative lanes before show-all table fallback", async () => {
  const page = await readFile("src/app/topics/[id]/page.tsx", "utf8");

  assert.match(page, /searchParams/);
  assert.match(page, /representativeCompanies/);
  assert.match(page, /stage\.companies\.slice\(0, REPRESENTATIVE_COMPANY_LIMIT\)/);
  assert.match(page, /REPRESENTATIVE_COMPANY_LIMIT\s*=\s*6/);
  assert.match(page, /href=\{`\/topics\/\$\{detail\.id\}\?stage=\$\{stage\.stage\}&view=all`\}/);
  assert.match(page, /industry-chain-show-all-table/);
  assert.match(page, /selectedStageCompanies/);

  const representativeIndex = page.indexOf("representativeCompanies");
  const fallbackIndex = page.indexOf("industry-chain-show-all-table");
  assert.ok(representativeIndex > -1);
  assert.ok(fallbackIndex > -1);
  assert.ok(representativeIndex < fallbackIndex, "default representative lanes should precede show-all fallback");
});

test("Goal 6 industry map UI labels partial state and narrative-only constraints", async () => {
  const page = await readFile("src/app/topics/[id]/page.tsx", "utf8");

  assert.match(page, /show all/);
  assert.match(page, /代表公司/);
  assert.match(page, /完整清單/);
  assert.match(page, /不補假公司/);
  assert.match(page, /narrative-only/);
});
