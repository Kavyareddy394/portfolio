/**
 * Minimal PNG reader plus the diff helpers the analysis scripts need.
 *
 * Dependency free on purpose: node:zlib does the inflate and the artwork is
 * plain 8 bit non interlaced RGB, which is all /public/scene contains. Adding a
 * decoder dependency for a build time script would be more moving parts than
 * the 80 lines below.
 */

import { inflateSync } from "node:zlib";
import { readFileSync } from "node:fs";

/** @returns {{width:number,height:number,channels:number,data:Uint8Array}} */
export function decodePng(filePath) {
  const buffer = readFileSync(filePath);
  if (buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error(`${filePath} is not a PNG`);
  }

  let offset = 8;
  let header = null;
  const idat = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);

    if (type === "IHDR") {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        interlace: data[12],
      };
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }

    offset += 12 + length;
  }

  if (!header) throw new Error(`${filePath} has no IHDR`);
  if (header.bitDepth !== 8) {
    throw new Error(`${filePath} is ${header.bitDepth} bit, only 8 is supported`);
  }
  if (header.interlace !== 0) {
    throw new Error(`${filePath} is interlaced, which this reader does not handle`);
  }

  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[header.colorType];
  if (!channels) {
    throw new Error(`${filePath} has colour type ${header.colorType}`);
  }

  const raw = inflateSync(Buffer.concat(idat));
  const data = unfilter(raw, header.width, header.height, channels);

  return { width: header.width, height: header.height, channels, data };
}

function unfilter(raw, width, height, channels) {
  const stride = width * channels;
  const out = new Uint8Array(stride * height);
  let pos = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[pos];
    pos += 1;

    const row = y * stride;
    const prev = row - stride;

    for (let x = 0; x < stride; x += 1) {
      const value = raw[pos + x];
      const left = x >= channels ? out[row + x - channels] : 0;
      const up = y > 0 ? out[prev + x] : 0;
      const upLeft = x >= channels && y > 0 ? out[prev + x - channels] : 0;

      let restored;
      switch (filter) {
        case 0:
          restored = value;
          break;
        case 1:
          restored = value + left;
          break;
        case 2:
          restored = value + up;
          break;
        case 3:
          restored = value + ((left + up) >> 1);
          break;
        case 4: {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upLeft);
          restored = value + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
          break;
        }
        default:
          throw new Error(`unsupported PNG filter ${filter} on row ${y}`);
      }

      out[row + x] = restored & 0xff;
    }

    pos += stride;
  }

  return out;
}

/**
 * Per pixel largest absolute channel difference, as a mask.
 *
 * `floor` lets a caller ignore faint differences such as the ambient glow a
 * screen throws onto the wall, which is noise when hunting for the screen
 * rectangle itself.
 */
export function diffMask(a, b, floor = 12) {
  const width = Math.min(a.width, b.width);
  const height = Math.min(a.height, b.height);
  const mask = new Uint8Array(width * height);
  const delta = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * a.channels;
      const j = (y * b.width + x) * b.channels;
      const value = Math.max(
        Math.abs(a.data[i] - b.data[j]),
        Math.abs(a.data[i + 1] - b.data[j + 1]),
        Math.abs(a.data[i + 2] - b.data[j + 2]),
      );
      delta[y * width + x] = value;
      mask[y * width + x] = value >= floor ? 1 : 0;
    }
  }

  return {
    width,
    height,
    mask,
    delta,
    clipped: a.width !== b.width || a.height !== b.height,
  };
}

/**
 * Blobs of set pixels, returned as tight boxes.
 *
 * The mask is first reduced to a coarse grid so a handful of stray pixels from
 * the artwork's own noise cannot invent a region, then neighbouring cells are
 * flood filled and each blob is trimmed back to the pixels that actually differ.
 */
export function maskRegions({ width, height, mask }, options = {}) {
  const cell = options.cell ?? 6;
  const hitRatio = options.hitRatio ?? 0.18;
  const minCells = options.minCells ?? 24;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const grid = new Uint8Array(cols * rows);

  for (let gy = 0; gy < rows; gy += 1) {
    for (let gx = 0; gx < cols; gx += 1) {
      let hits = 0;
      let total = 0;
      const xEnd = Math.min(width, (gx + 1) * cell);
      const yEnd = Math.min(height, (gy + 1) * cell);
      for (let y = gy * cell; y < yEnd; y += 1) {
        for (let x = gx * cell; x < xEnd; x += 1) {
          total += 1;
          hits += mask[y * width + x];
        }
      }
      grid[gy * cols + gx] = total > 0 && hits / total >= hitRatio ? 1 : 0;
    }
  }

  const seen = new Uint8Array(cols * rows);
  const blobs = [];

  for (let start = 0; start < grid.length; start += 1) {
    if (!grid[start] || seen[start]) continue;

    const stack = [start];
    seen[start] = 1;
    let minGx = cols;
    let maxGx = 0;
    let minGy = rows;
    let maxGy = 0;
    let cells = 0;

    while (stack.length > 0) {
      const at = stack.pop();
      const gx = at % cols;
      const gy = Math.floor(at / cols);
      cells += 1;
      if (gx < minGx) minGx = gx;
      if (gx > maxGx) maxGx = gx;
      if (gy < minGy) minGy = gy;
      if (gy > maxGy) maxGy = gy;

      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = gx + dx;
        const ny = gy + dy;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
        const n = ny * cols + nx;
        if (grid[n] && !seen[n]) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }

    if (cells < minCells) continue;

    // Trim the cell box back onto real differences.
    const box = {
      x0: minGx * cell,
      y0: minGy * cell,
      x1: Math.min(width, (maxGx + 1) * cell) - 1,
      y1: Math.min(height, (maxGy + 1) * cell) - 1,
    };
    const tight = tighten(mask, width, height, box);
    if (tight) blobs.push({ ...tight, cells, area: cells * cell * cell });
  }

  blobs.sort((p, q) => q.area - p.area);
  return blobs;
}

function tighten(mask, width, height, box) {
  let x0 = box.x1;
  let y0 = box.y1;
  let x1 = box.x0;
  let y1 = box.y0;
  let any = false;

  for (let y = box.y0; y <= box.y1; y += 1) {
    for (let x = box.x0; x <= box.x1; x += 1) {
      if (!mask[y * width + x]) continue;
      any = true;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }

  return any ? { x0, y0, x1, y1, width: x1 - x0 + 1, height: y1 - y0 + 1 } : null;
}

/** Luminance of one pixel, 0 to 255. */
export function luma(image, x, y) {
  const i = (y * image.width + x) * image.channels;
  return 0.2126 * image.data[i] + 0.7152 * image.data[i + 1] + 0.0722 * image.data[i + 2];
}

/**
 * Text rendering of an image, so a layout can be read without a screen.
 *
 * `mode` picks what each cell shows: "luma" for brightness, "diff" for the
 * difference mask. Cells are sampled at their centre, which is enough to place
 * things by eye and cheap enough to run over a dozen 1672x941 frames.
 */
export function asciiMap(image, { cols = 96, rows = 40, mode = "luma", mask = null } = {}) {
  const ramp = " .:-=+*#%@";
  const lines = [];

  for (let gy = 0; gy < rows; gy += 1) {
    let line = "";
    for (let gx = 0; gx < cols; gx += 1) {
      const x = Math.min(image.width - 1, Math.floor(((gx + 0.5) * image.width) / cols));
      const y = Math.min(image.height - 1, Math.floor(((gy + 0.5) * image.height) / rows));

      if (mode === "diff") {
        const hit = mask.mask[y * mask.width + x];
        line += hit ? "#" : ".";
        continue;
      }

      const value = luma(image, x, y);
      line += ramp[Math.min(ramp.length - 1, Math.floor((value / 256) * ramp.length))];
    }
    lines.push(line);
  }

  return lines;
}

/**
 * Text rendering of how much two images differ, cell by cell.
 *
 * Same sampling as asciiMap, but each cell shows the difference against a second
 * picture rather than the brightness of one. Reading the shape of the output is
 * how you tell a screen rectangle (a tidy block that stops at the bezel) from a
 * person (an uneven mass with soft edges) when the artwork has been regenerated
 * and every pixel in the room is slightly off.
 */
export function asciiDelta(a, b, { cols = 60, rows = 26, region = null } = {}) {
  const ramp = " .:-=+*#%@";
  const x0 = region ? Math.floor((region.x / 100) * a.width) : 0;
  const y0 = region ? Math.floor((region.y / 100) * a.height) : 0;
  const x1 = region
    ? Math.min(a.width, Math.ceil(((region.x + region.width) / 100) * a.width))
    : a.width;
  const y1 = region
    ? Math.min(a.height, Math.ceil(((region.y + region.height) / 100) * a.height))
    : a.height;

  const lines = [];
  for (let gy = 0; gy < rows; gy += 1) {
    let line = "";
    for (let gx = 0; gx < cols; gx += 1) {
      const x = Math.min(x1 - 1, Math.max(x0, x0 + Math.floor(((gx + 0.5) * (x1 - x0)) / cols)));
      const y = Math.min(y1 - 1, Math.max(y0, y0 + Math.floor(((gy + 0.5) * (y1 - y0)) / rows)));
      const value = channelDelta(a, b, x, y);
      line += ramp[Math.min(ramp.length - 1, Math.floor((value / 256) * ramp.length))];
    }
    lines.push(line);
  }
  return lines;
}

/** Largest absolute per-channel difference at one pixel, ignoring size mismatch. */
function channelDelta(a, b, x, y) {
  const i = (y * a.width + x) * a.channels;
  const j = (y * b.width + x) * b.channels;
  if (x >= b.width || y >= b.height) return 0;
  return Math.max(
    Math.abs(a.data[i] - b.data[j]),
    Math.abs(a.data[i + 1] - b.data[j + 1]),
    Math.abs(a.data[i + 2] - b.data[j + 2]),
  );
}

/**
 * Mean difference over a percentage region, used to calibrate one measurement
 * against another: every frame in /public/scene was generated separately, so the
 * whole room drifts a little between them and only a difference measured against
 * the same frame's own background is worth reading.
 */
export function regionDelta(a, b, region) {
  const x0 = Math.max(0, Math.floor((region.x / 100) * a.width));
  const y0 = Math.max(0, Math.floor((region.y / 100) * a.height));
  const x1 = Math.min(a.width, Math.ceil(((region.x + region.width) / 100) * a.width));
  const y1 = Math.min(a.height, Math.ceil(((region.y + region.height) / 100) * a.height));

  let sum = 0;
  let count = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      sum += channelDelta(a, b, x, y);
      count += 1;
    }
  }
  return count > 0 ? sum / count : 0;
}

/** A box as artwork percentages, which is what config/scene.ts speaks. */
export function asPercent(box, width, height) {
  const round = (n) => Math.round(n * 10) / 10;
  return {
    x: round((box.x0 / width) * 100),
    y: round((box.y0 / height) * 100),
    width: round((box.width / width) * 100),
    height: round((box.height / height) * 100),
  };
}
