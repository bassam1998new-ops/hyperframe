import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import {
  MAX_REFERENCE_BYTES,
  createUrlReference,
  storeReferenceUpload,
  validateReferenceFileName
} from "../src/reference-files.mjs";
import { listReferences } from "../src/brain.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-reference-file-"));
}

test("reference file validation accepts creative/document types and blocks executables", () => {
  assert.equal(validateReferenceFileName("hero.MP4").extension, ".mp4");
  assert.equal(validateReferenceFileName("brief.pdf").extension, ".pdf");
  assert.equal(validateReferenceFileName("notes.docx").extension, ".docx");

  assert.throws(
    () => validateReferenceFileName("payload.exe"),
    /Unsupported reference file type/
  );
});

test("URL references require http/https and preserve reference role", () => {
  const cwd = temp();

  const result = createUrlReference({
    name: "Campaign Reference",
    url: "https://example.test/reference",
    referenceRole: "source_material"
  }, cwd);

  assert.equal(result.reference.source.type, "url");
  assert.equal(result.reference.source.role, "source_material");
  assert.equal(result.reference.source.value, "https://example.test/reference");

  assert.throws(
    () => createUrlReference({
      name: "Bad",
      url: "file:///etc/passwd"
    }, cwd),
    /http or https/
  );
});

test("duplicate URL reference names get unique stable records", () => {
  const cwd = temp();
  createUrlReference({
    name: "Same",
    url: "https://example.test/a"
  }, cwd);
  createUrlReference({
    name: "Same",
    url: "https://example.test/b"
  }, cwd);

  const refs = listReferences(cwd);
  assert.equal(refs.length, 2);
  assert.notEqual(refs[0].id, refs[1].id);
});

test("streamed upload is stored inside AurorA and creates a file reference", async () => {
  const cwd = temp();
  const req = new PassThrough();
  req.headers = {
    "content-length": "11"
  };

  const promise = storeReferenceUpload(req, {
    cwd,
    filename: "../Hero Image.png",
    name: "Hero Image",
    referenceRole: "visual",
    mime: "image/png"
  });

  req.end(Buffer.from("hello world"));

  const result = await promise;
  assert.equal(result.reference.source.type, "file");
  assert.equal(result.reference.source.role, "visual");
  assert.equal(result.reference.source.original_name, "Hero Image.png");
  assert.match(result.reference.source.value, /^\.aurora\/references\/files\//);
  assert.ok(fs.existsSync(result.stored_file));
  assert.equal(result.size_bytes, 11);
});

test("declared upload over the hard limit is rejected before writing", async () => {
  const cwd = temp();
  const req = new PassThrough();
  req.headers = {
    "content-length": String(MAX_REFERENCE_BYTES + 1)
  };

  await assert.rejects(
    () => storeReferenceUpload(req, {
      cwd,
      filename: "huge.mp4"
    }),
    /larger than the 512 MB/
  );
});
