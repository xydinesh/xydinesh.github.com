// Drafts preview under `npm start` (run mode "serve"/"watch") but are dropped
// from production builds (run mode "build") — which is what `npm run build`,
// `npm test`, and the Pages deploy all use.
const PREVIEW = ["serve", "watch"].includes(process.env.ELEVENTY_RUN_MODE);

const isDraft = (data) => data.draft === true || data.draft === "true";

module.exports = { isDraft, isUnpublished: (data) => isDraft(data) && !PREVIEW };
