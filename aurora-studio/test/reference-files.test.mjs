import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import {
  MAX_REFERENCE_BYTES,
  createUrlReference,
  storeReferenceUpload,
  validateReferenceFileName
} from "../src/reference-files.mjs";
import { listReferences, readReference } from "../src/brain.mjs";

function temp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "aurora-reference-files-"));
}

function uploadStream(content, headers = {}) {
  const stream = Readable.from([Buffer.from(content)]);
  stream.headers = {
    "content-length": String(Buffer.byteLength(content)),
    ...headers
  };
  return stream;
}

test("reference filename validation accepts supported creative/source files", () => {
  assert.equal(validateReferenceFileName("reference.mp4").extension, ".mp4");
  assert.equal(validateReferenceFileName("mood board.PNG").extension, ".png");
  assert.equal(validateReferenceFileName("brief.pdf").extension, ".pdf");
  assert.equal(validateReferenceFileName("notes.docx").extension, ".docx");

  assert.throws(
    () => validateReferenceFileName("malware.exe"),
    /Unsupported reference file type/
  );
});

test("URL references require http(s), preserve role, and get unique names", () => {
  const cwd = temp();

  const first = createUrlReference({
    name: "Campaign Reference",
    url: "https://example.com/reference",
    referenceRole: "visual"
  }, cwd);

  const second = createUrlReference({
    name: "Campaign Reference",
    url: "https://example.com/source",
    referenceRole: "source_material"
  }, cwd);

  assert.equal(first.reference.id, "campaign-reference");
  assert.equal(first.reference.source.type, "url");
  assert.equal(first.reference.source.role, "visual");

  assert.equal(second.reference.id, "campaign-reference-2");
  assert.equal(second.reference.source.role, "source_material");

  assert.throws(
    () => createUrlReference({
      name: "Bad",
      url: "file:///etc/passwd"
    }, cwd),
    /http or https/
  );
});

test("uploaded references are stored inside AurorA and tracked by reference JSON", async () => {
  const cwd = temp();
  const req = uploadStream("fake-image-content", {
    "content-type": "image/png"
  });

  const result = await storeReferenceUpload(req, {
    cwd,
    filename: "../Client Hero.PNG",
    name: "Hero Reference",
    referenceRole: "visual",
    mime: "image/png"
  });

  assert.ok(fs.existsSync(result.stored_file));
  assert.ok(
    result.stored_file.startsWith(
      path.join(cwd, ".aurora", "references", "files")
    )
  );

  const relative = path.relative(cwd, result.stored_file).split(path.sep).join("/");
  assert.equal(result.reference.source.type, "file");
  assert.equal(result.reference.source.value, relative);
  assert.equal(result.reference.source.role, "visual");
  assert.equal(result.reference.source.original_name, "Client Hero.PNG");

  const listed = listReferences(cwd);
  assert.equal(listed.length, 1);
  assert.equal(listed[0].source.value, relative);

  const reread = readReference(result.reference.id, cwd);
  assert.equal(reread.reference.source.mime, "image/png");
});

test("reference uploads fail closed when declared size exceeds Studio cap", async () => {
  const cwd = temp();
  const req = uploadStream("x");
  req.headers["content-length"] = String(MAX_REFERENCE_BYTES + 1);

  await assert.rejects(
    () => storeReferenceUpload(req, {
      cwd,
      filename: "too-big.mp4"
    }),
    /larger than the 512 MB Studio limit/
  );

  const filesDir = path.join(cwd, ".aurora", "references", "files");
  assert.equal(fs.existsSync(filesDir), false);
});
