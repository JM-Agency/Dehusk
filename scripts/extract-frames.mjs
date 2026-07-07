import ffmpegPath from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const INPUT = path.join(root, "Visual/DehuskHeader.mp4");
const OUT_DIR = path.join(root, "public/frames");
const FPS = 15;
const WIDTH = 1280;

if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

console.log("Extracting frames from", INPUT);

execFileSync(ffmpegPath, [
  "-y",
  "-i", INPUT,
  "-vf", `fps=${FPS},scale=${WIDTH}:-2:flags=lanczos`,
  "-c:v", "libwebp",
  "-quality", "78",
  path.join(OUT_DIR, "frame_%04d.webp"),
], { stdio: "inherit" });

console.log("Done. Frames written to", OUT_DIR);
