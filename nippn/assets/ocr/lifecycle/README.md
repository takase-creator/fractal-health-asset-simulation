# Tesseract.js 5.1.1 lifecycle patch (2026-11-24)

Recognition engine, Japanese model, OEM and segmentation are unchanged.
`createWorker.js` is derived from the Apache-2.0 source at:
https://github.com/naptha/tesseract.js/blob/v5.1.1/src/createWorker.js

Changes:
- Reject startup on language/API initialization failure (upstream swallowed the chain rejection).
- Settle all pending jobs when a worker crashes or is explicitly terminated.
- Accept an AbortSignal to terminate even a worker whose startup has not resolved.
- Remove completed promise callbacks and abort listeners, and ignore late messages.
- Do not throw an unhandled error from the message handler; return it to the caller.

The UI bounds each stage, avoids IndexedDB model caching, retries once at a smaller
image size, and retains the first-pass candidates if the second pass fails.
No image or recognized health information is sent to a server.

Rebuild from the official npm packages `tesseract.js@5.1.1` and `esbuild@0.25.12`:
`node tools/build-ocr-lifecycle.cjs /path/to/node_modules`
The build overrides only src/createWorker.js using this retained source.
The original official library/worker distributions and license notices are retained.
Run `node tests/nippn-ocr-recovery.test.js` and the OCR layout/result guards.
