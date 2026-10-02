/* ============================================================
   BUILD - the bench makes the mod itself.

   Everything here is the machinery under the Build page: laying the
   icons out on their sheets, writing an uncompressed DDS the engine
   will read, spelling the Russian file in the encoding it declares,
   and putting the lot in a zip - all in the browser, with nothing
   fetched and nothing installed.

   WHAT IT WILL NOT DO IS THE POINT. Anything that needs a line of the
   mod's script changed cannot come out of here, and the page says so
   by name rather than quietly leaving it out.
   ============================================================ */
(function (root) {
"use strict";

var CELL = 50;              // one inv_grid unit of texture, per art/mkdds
var ATLAS = 2048;

/* ------------------------------------------------------------
   THE THREE SHEETS

   Every item on a sheet occupies a rectangle measured in inv_grid
   units of 50 px, and at inv_grid_scale = 2 that is 100 px per
   displayed cell. So a 2 x 3 cell rig is a 4 x 6 rect, 200 x 300 px.

   NOTHING MOVES UNLESS SOMETHING HAS TO. An item whose rectangle is
   the size it always was keeps the exact pixels it had, which is what
   makes an unchanged build byte-identical to the mod it replaces.

   ...BUT A SIZE CAN CHANGE NOW, and that breaks the fixed grid the
   generators used. The rig sheet was laid out on a 250 px pitch for a
   200 px rect: make one rig three cells wide and it is 300 px, and it
   runs into its neighbour. So the moment any item on a sheet wants a
   different rectangle from the one it has, that whole sheet is packed
   again from scratch - every item moves to a place that fits, every
   section gets its new inv_grid_x/y, and the picture is redrawn.

   Repacking is deterministic: sorted by height then width then id, so
   the same bench always produces the same sheet. Two builds of the same
   save are the same bytes.
   ------------------------------------------------------------ */
var GUTTER = 1;             // one grid unit - 50 px - between rectangles
var SPAN = 40;              // 2048 / 50, floored: usable units across

function wantRect(it, dflt) {
  var w = (it.cellw || dflt[0] / 2) * 2;
  var h = (it.cellh || dflt[1] / 2) * 2;
  return { w: Math.max(2, Math.min(SPAN, Math.round(w))),
           h: Math.max(2, Math.min(SPAN, Math.round(h))) };
}

/* Shelf packing on the 50 px grid. Rows are filled left to right, a new
   row starts below the tallest thing in the last one, and everything is
   given a one-unit gutter so no two pictures touch. */
function packSheet(items) {
  var order = items.slice().sort(function (a, b) {
    return b.h - a.h || b.w - a.w || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
  var out = {}, over = [];
  var x = 0, y = 0, rowH = 0;
  order.forEach(function (it) {
    if (x + it.w > SPAN) { x = 0; y += rowH + GUTTER; rowH = 0; }
    if (y + it.h > SPAN) { over.push(it.id); return; }
    out[it.id] = { x: x, y: y, w: it.w, h: it.h };
    x += it.w + GUTTER;
    if (it.h > rowH) rowH = it.h;
  });
  return { rects: out, overflow: over };
}

/* The plan for one sheet: keep what fits, repack when a size moved. */
function planSheet(items, pitch, dflt) {
  var wants = items.map(function (it) {
    var r = wantRect(it.item, dflt);
    return { id: it.id, w: r.w, h: r.h, rect: it.rect };
  });

  // Did anything ask for a rectangle it does not already have?
  var moved = wants.some(function (it) {
    return !it.rect || it.rect.w !== it.w || it.rect.h !== it.h;
  });

  if (!moved) {
    var keep = {};
    wants.forEach(function (it) { keep[it.id] = it.rect; });
    return { rects: keep, overflow: [], repacked: false };
  }

  // A NEW ITEM ALONE DOES NOT DISTURB THE OTHERS. If every item that
  // already has a rectangle still wants that same rectangle, the new
  // ones simply take free slots on the old pitch - which keeps the
  // sheet's existing pixels and its existing diff.
  var settled = wants.filter(function (it) { return it.rect; });
  var quiet = settled.every(function (it) {
    return it.rect.w === it.w && it.rect.h === it.h;
  });
  if (quiet) {
    var placed = {}, used = {};
    settled.forEach(function (it) {
      placed[it.id] = it.rect; used[it.rect.x + "," + it.rect.y] = 1;
    });
    var free = [];
    for (var r = 0; r + pitch[1] <= SPAN + pitch[1] - 1; r += pitch[1])
      for (var c = 0; c + pitch[0] <= SPAN + pitch[0] - 1; c += pitch[0])
        if (!used[c + "," + r] && c + pitch[0] <= SPAN && r + pitch[1] <= SPAN)
          free.push({ x: c, y: r });
    var fits = true, over = [];
    wants.filter(function (it) { return !it.rect; }).forEach(function (it) {
      // ...only while the newcomer fits the pitch the sheet was built
      // on. Anything bigger means the whole sheet has to be packed.
      if (it.w > pitch[0] || it.h > pitch[1]) { fits = false; return; }
      var slot = free.shift();
      if (!slot) { over.push(it.id); return; }
      placed[it.id] = { x: slot.x, y: slot.y, w: it.w, h: it.h };
    });
    if (fits) return { rects: placed, overflow: over, repacked: false };
  }

  var packed = packSheet(wants);
  packed.repacked = true;
  return packed;
}

var RIG_PITCH = [5, 7], RIG_RECT = [4, 6];      // 2 x 3 cells
var BOX_PITCH = [7, 7], BOX_RECT = [4, 4];      // 2 x 2 cells
var POUCH_PITCH = [5, 5], POUCH_RECT = [4, 4];  // 2 x 2 cells
/* ANYTHING AT ALL. The other three sheets hold one kind of thing and
   can be pitched to it; this one holds whatever somebody points the
   Item editor at - a hunting kit, a backpack, a tin of something - so
   the pitch is generous and the rectangle comes from the item. */
var ITEM_PITCH = [7, 9], ITEM_RECT = [4, 4];

/* An adopted rig wears the other mod's picture and is not on our
   sheet, so it is not laid out here either. */
function rigSheetPlan(db, seedRects) {
  return planSheet(db.rigs.filter(function (r) { return !r.adopt; })
    .map(function (r) {
      return { id: r.id, rect: seedRects[r.id], item: r };
    }), RIG_PITCH, RIG_RECT);
}
/* Only pouches of OURS go on this sheet. The magazine mod's three wear
   its pictures and are not ours to redraw. */
function pouchSheetPlan(db, seedRects) {
  var mine = (db.pouches || []).filter(function (p) {
    return ["af_magpouch_s", "af_magpouch_m", "af_magpouch_l"].indexOf(p.id) < 0;
  });
  return planSheet(mine.map(function (p) {
    return { id: p.id, rect: seedRects[p.id], item: p };
  }), POUCH_PITCH, POUCH_RECT);
}
/* The Item editor's sheet, and the backpacks' - they are items too, so
   they share one rather than having a sheet each with four pictures on
   it. An adopted thing only lands here if its picture was taken over. */
function itemSheetPlan(db, seedRects) {
  var want = (db.items || []).concat(db.packs && db.packs.length ? db.packs : [])
    .filter(function (x) {
      return x && x.id && x.icon && (!x.adopt || (x.own && x.own.look));
    });
  return planSheet(want.map(function (x) {
    return { id: x.id, rect: seedRects[x.id], item: x };
  }), ITEM_PITCH, ITEM_RECT);
}
function boxSheetPlan(db, seedRects) {
  return planSheet(db.boxes.filter(function (b) { return !b.borrowed && !b.adopt; })
    .map(function (b) { return { id: b.id, rect: seedRects[b.id], item: b }; }),
    BOX_PITCH, BOX_RECT);
}

/* ------------------------------------------------------------
   HOW BIG THE PICTURE IS INSIDE ITS RECTANGLE

     "when i added texture for the box and set how much space it takes,
      the texture is taken as is and not scaled to better much how much
      grid cells the item takes"

   It was fitted and centred - the whole picture inside the rectangle,
   the largest it can be without being cut - which is right for art
   drawn to the item's own shape and leaves a square drawing sitting in
   a sea of margin on a 2 x 3 rig.

   So the fit is a setting now: a zoom about the centre and a nudge,
   both relative to the rectangle rather than to pixels, so they mean
   the same thing whatever size the drawing is and survive the item
   being resized.

   ONE FUNCTION FOR THE SHEET AND FOR THE PREVIEW. The page draws this
   over a grid of the item's own cells so you can see what the game
   will show, and a preview computed even slightly differently from the
   thing it previews is worse than none.

   zoom 1, dx 0, dy 0 is exactly what it did before, which is what
   every item that has never been touched still says.
   ------------------------------------------------------------ */
function fitRect(iw, ih, rw, rh, fit) {
  var z = (fit && +fit.zoom) || 1;
  if (!(z > 0)) z = 1;
  var dx = (fit && +fit.dx) || 0, dy = (fit && +fit.dy) || 0;
  var k = Math.min(rw / iw, rh / ih) * z;
  var w = Math.max(1, Math.round(iw * k));
  var h = Math.max(1, Math.round(ih * k));
  return { w: w, h: h,
           x: Math.floor((rw - w) / 2 + dx * rw),
           y: Math.floor((rh - h) / 2 + dy * rh) };
}

/* Draw every icon onto one canvas at the rect it was given. The
   picture is fitted inside its rect and centred, exactly as
   art/mkboxdds does it, so a replacement drawing of a different shape
   still sits where the old one sat - unless the item says otherwise;
   see fitRect. */
/* ============================================================
   ONE PICTURE, AT A SIZE, AS PIXELS

   composeSheet packs small pictures onto a page at known rectangles.
   The menu's backdrop is not that: it is one picture stretched across
   the whole menu, so it wants the dds writer and none of the packing.

   STRETCHED TO FILL, NOT FITTED. The engine stretches whatever it is
   given across 1025 x 768 - the one SoTA ships is 32 x 32 - so drawing
   it any other way here would show the player something the game is
   not going to do.
   ============================================================ */
function pictureData(src, w, h) {
  return new Promise(function (done, fail) {
    var im = new Image();
    im.onload = function () {
      var cv = document.createElement("canvas");
      cv.width = w; cv.height = h;
      var cx = cv.getContext("2d");
      cx.clearRect(0, 0, w, h);
      cx.drawImage(im, 0, 0, w, h);
      done(cx.getImageData(0, 0, w, h));
    };
    im.onerror = function () { fail(new Error("that picture will not open")); };
    im.src = src;
  });
}

/* ============================================================
   PAINTING INTO THE SHEET WITHOUT TOUCHING THE REST OF IT

   ui_actor_menu.dds is the player's own drawing - 62 MB of it, made in
   an image editor, and the audit's rule about it is "is the file we
   ship still the file they drew", because the way to lose a hand-drawn
   sheet is for something to helpfully regenerate it.

   So this does NOT put the sheet through a canvas. A canvas keeps
   colour multiplied by alpha, so a picture that came off one and went
   straight back on returns with its soft edges a shade or two out -
   which on an items sheet is invisible and here would be 62 MB of
   somebody else's artwork quietly re-encoded.

   What happens instead: the NEW picture goes through a canvas (it has
   to - it is being scaled), and its pixels are written straight into a
   copy of the file's own bytes at the rectangle. Every byte outside
   those rectangles is the byte that came in - a promise a test can
   check by comparing the two files.

   A COPY, not the original array: a build that throws half way through
   must leave the sheet the page is holding exactly as it was, or the
   second attempt starts from a half-painted one.
   ============================================================ */
function sheetSize(bytes) {
  if (!bytes || bytes.length < 128) return null;
  var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (dv.getUint32(0, true) !== 0x20534444) return null;      // "DDS "
  var h = dv.getUint32(12, true), w = dv.getUint32(16, true);
  var four = dv.getUint32(84, true), bits = dv.getUint32(88, true);
  if (four !== 0 || bits !== 32) return null;                 // compressed, or not 32-bit
  if (bytes.length < 128 + w * h * 4) return null;            // truncated
  return { w: w, h: h };
}

/* One picture, rendered at the size of the rectangle it is going into.
   `stretch` pulls it to fill - which is what the engine does with the
   whole-menu backdrop. Everything else is fitted and centred, because
   inside one of these rectangles the pixels are square: 694 across for
   488 screen pixels and 1536 down for 1080 is 1.422 either way, so
   what is drawn is the shape that comes out. */
function fitPicture(src, rw, rh, fit, stretch) {
  return new Promise(function (done, fail) {
    var im = new Image();
    im.onload = function () {
      var cv = document.createElement("canvas");
      cv.width = rw; cv.height = rh;
      var cx = cv.getContext("2d");
      cx.clearRect(0, 0, rw, rh);
      if (stretch) {
        cx.drawImage(im, 0, 0, rw, rh);
      } else {
        var f = fitRect(im.width, im.height, rw, rh, fit);
        cx.save(); cx.beginPath(); cx.rect(0, 0, rw, rh); cx.clip();
        cx.drawImage(im, f.x, f.y, f.w, f.h);
        cx.restore();
      }
      done(cx.getImageData(0, 0, rw, rh));
    };
    im.onerror = function () { fail(new Error("that picture will not open")); };
    im.src = src;
  });
}

function paintSheet(bytes, jobs) {
  var size = sheetSize(bytes);
  if (!size) throw new Error(
    "that is not an uncompressed 32-bit dds - the sheet this needs is "
    + "A8R8G8B8 with no mipmaps");
  var w = size.w, h = size.h;
  var out = bytes.slice();
  jobs.forEach(function (j) {
    var r = j.rect, src = j.img.data;
    if (r.x < 0 || r.y < 0 || r.x + r.w > w || r.y + r.h > h)
      throw new Error("the " + (j.id || "picture") + " rectangle is off the "
        + "edge of that sheet (" + w + " x " + h + ")");
    for (var row = 0; row < r.h; row++) {
      var o = 128 + ((r.y + row) * w + r.x) * 4;
      var i = row * r.w * 4;
      for (var c = 0; c < r.w; c++) {
        /* B, G, R, A - the masks in the header are little-endian, and a
           swapped pair reads as a blue panel rather than as an error. */
        out[o] = src[i + 2]; out[o + 1] = src[i + 1];
        out[o + 2] = src[i]; out[o + 3] = src[i + 3];
        o += 4; i += 4;
      }
    }
  });
  return out;
}

function composeSheet(entries) {
  var cv = document.createElement("canvas");
  cv.width = cv.height = ATLAS;
  var cx = cv.getContext("2d");
  cx.clearRect(0, 0, ATLAS, ATLAS);
  return Promise.all(entries.map(function (e) {
    return new Promise(function (done) {
      if (!e.icon) return done();
      var im = new Image();
      im.onload = function () {
        var rw = e.rect.w * CELL, rh = e.rect.h * CELL;
        var f = fitRect(im.width, im.height, rw, rh, e.fit);
        /* CLIPPED TO ITS OWN RECTANGLE. Zoomed past the edges the
           drawing would run over whatever is packed beside it on the
           sheet - which is not a picture that is too big, it is two
           items sharing pixels. */
        cx.save();
        cx.beginPath();
        cx.rect(e.rect.x * CELL, e.rect.y * CELL, rw, rh);
        cx.clip();
        cx.drawImage(im, e.rect.x * CELL + f.x, e.rect.y * CELL + f.y, f.w, f.h);
        cx.restore();
        done();
      };
      im.onerror = function () { done(); };
      im.src = e.icon;
    });
  })).then(function () { return cx.getImageData(0, 0, ATLAS, ATLAS); });
}

/* ------------------------------------------------------------
   THE DDS
   Uncompressed A8R8G8B8, no mipmaps - the header the shipped sheets
   carry, byte for byte. Little-endian masks mean the bytes go down as
   B, G, R, A, which is the one thing worth getting wrong quietly: a
   swapped pair reads as a blue rig rather than as an error.
   ------------------------------------------------------------ */
function ddsFrom(imageData) {
  var w = imageData.width, h = imageData.height, src = imageData.data;
  var out = new Uint8Array(128 + w * h * 4);
  var dv = new DataView(out.buffer);
  out.set([0x44, 0x44, 0x53, 0x20], 0);             // "DDS "
  var head = [124, 0x100F, h, w, w * 4, 0, 1];       // size, flags, h, w, pitch, depth, mips
  head.forEach(function (v, i) { dv.setUint32(4 + i * 4, v, true); });
  dv.setUint32(76, 32, true);                        // pixelformat size
  dv.setUint32(80, 0x41, true);                      // DDPF_RGB | DDPF_ALPHAPIXELS
  dv.setUint32(88, 32, true);                        // bits per pixel
  dv.setUint32(92, 0x00FF0000, true);                // R
  dv.setUint32(96, 0x0000FF00, true);                // G
  dv.setUint32(100, 0x000000FF, true);               // B
  dv.setUint32(104, 0xFF000000, true);               // A
  dv.setUint32(108, 0x1000, true);                   // DDSCAPS_TEXTURE
  for (var i = 0, o = 128; i < src.length; i += 4, o += 4) {
    out[o] = src[i + 2]; out[o + 1] = src[i + 1];
    out[o + 2] = src[i]; out[o + 3] = src[i + 3];
  }
  return out;
}

/* ------------------------------------------------------------
   THE RUSSIAN FILE IS windows-1251
   It says so in its own header and the game believes the header. The
   bytes were UTF-8 inside a file claiming cp1251 once, and every
   Russian player read this mod as a row of nonsense until somebody
   noticed. TextEncoder only speaks UTF-8, so the table is here.
   ------------------------------------------------------------ */
var CP1251_HIGH = "ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—�™љ›њќћџ ЎўЈ¤Ґ¦§Ё©Є«¬­®Ї°±Ііґµ¶·ё№є»јЅѕїАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя";
var CP1251_MAP = null;
function cp1251(str) {
  if (!CP1251_MAP) {
    CP1251_MAP = {};
    for (var i = 0; i < CP1251_HIGH.length; i++) CP1251_MAP[CP1251_HIGH[i]] = 0x80 + i;
  }
  var out = new Uint8Array(str.length);
  for (var j = 0; j < str.length; j++) {
    var c = str.charCodeAt(j);
    if (c < 128) out[j] = c;
    else if (CP1251_MAP[str[j]] != null) out[j] = CP1251_MAP[str[j]];
    else out[j] = 63;                                // "?" - visible, not silent
  }
  return out;
}
function utf8(str) { return new TextEncoder().encode(str); }

/* ------------------------------------------------------------
   THE ZIP
   Store, or deflate where the browser has it. No library: this file
   has to work with the network unplugged.
   ------------------------------------------------------------ */
var CRCT = null;
function crc32(buf) {
  if (!CRCT) {
    CRCT = new Int32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      CRCT[n] = c;
    }
  }
  var crc = -1;
  for (var i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRCT[(crc ^ buf[i]) & 0xFF];
  return (crc ^ -1) >>> 0;
}
function deflate(bytes) {
  if (typeof CompressionStream === "undefined") return Promise.resolve(null);
  try {
    var cs = new CompressionStream("deflate-raw");
    var w = cs.writable.getWriter();
    w.write(bytes); w.close();
    return new Response(cs.readable).arrayBuffer()
      .then(function (b) { return new Uint8Array(b); })
      .catch(function () { return null; });
  } catch (e) { return Promise.resolve(null); }
}
function zip(files) {
  // files: [{ name, bytes }]
  return files.reduce(function (chain, f) {
    return chain.then(function (acc) {
      return deflate(f.bytes).then(function (d) {
        var use = d && d.length < f.bytes.length;
        acc.push({ name: f.name, raw: f.bytes,
                   body: use ? d : f.bytes, method: use ? 8 : 0,
                   crc: crc32(f.bytes) });
        return acc;
      });
    });
  }, Promise.resolve([])).then(function (parts) {
    var chunks = [], central = [], offset = 0;
    parts.forEach(function (p) {
      var name = utf8(p.name);
      var lf = new Uint8Array(30 + name.length);
      var dv = new DataView(lf.buffer);
      dv.setUint32(0, 0x04034B50, true);
      dv.setUint16(4, 20, true); dv.setUint16(6, 0x0800, true);
      dv.setUint16(8, p.method, true);
      dv.setUint32(14, p.crc, true);
      dv.setUint32(18, p.body.length, true);
      dv.setUint32(22, p.raw.length, true);
      dv.setUint16(26, name.length, true);
      lf.set(name, 30);
      chunks.push(lf, p.body);
      var cd = new Uint8Array(46 + name.length);
      var cv = new DataView(cd.buffer);
      cv.setUint32(0, 0x02014B50, true);
      cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, p.method, true);
      cv.setUint32(16, p.crc, true);
      cv.setUint32(20, p.body.length, true);
      cv.setUint32(24, p.raw.length, true);
      cv.setUint16(28, name.length, true);
      cv.setUint32(42, offset, true);
      cd.set(name, 46);
      central.push(cd);
      offset += lf.length + p.body.length;
    });
    var cdSize = central.reduce(function (a, c) { return a + c.length; }, 0);
    var end = new Uint8Array(22);
    var ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054B50, true);
    ev.setUint16(8, parts.length, true);
    ev.setUint16(10, parts.length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, offset, true);
    return new Blob(chunks.concat(central, [end]), { type: "application/zip" });
  });
}

/* ============================================================
   LEARNING A NEWER MOD FROM ITS ZIP

     "when i ask you to change something in the mod and you did that,
      then the tool has old version of the mod ... what i need is
      option to put a updated mod version from you to the tool so it
      will know what was added."

   Everything the bench knows about Squared Away is baked in when I
   build the page, which means a page from Tuesday builds Tuesday's
   mod. This reads a Squared Away zip instead: unzips it in the
   browser, parses the configs, cuts the pictures out of the sheets,
   and replaces what the bench knows - keeping every item YOU added.

   It is the same work mkseed.py does on my side, done here, so that a
   new mod does not need a new tool. Anybody with the page and a zip
   can bring it up to date, which is the point: fomok's friend can do
   it with whatever build he has.
   ============================================================ */

/* ------------------------------------------------------------
   A ZIP READER. There is a writer in this file already; this is the
   other direction. Central directory first - the only part of a zip
   that is authoritative about what is in it - then the local header
   for each entry we actually want.

   ONLY WHAT IS ASKED FOR IS DECOMPRESSED. A Squared Away zip carries
   ui_actor_menu.dds at sixty megabytes, and inflating it to find out
   it is not wanted would cost more than everything else together.
   ------------------------------------------------------------ */
function unzip(buf, want) {
  var dv = new DataView(buf), u8 = new Uint8Array(buf);
  // The end-of-central-directory record, found by walking back from
  // the tail - it is last, and its size varies with the comment.
  var end = -1;
  for (var i = buf.byteLength - 22; i >= 0 && i > buf.byteLength - 65558; i--) {
    if (dv.getUint32(i, true) === 0x06054B50) { end = i; break; }
  }
  if (end < 0) return Promise.reject(new Error("that is not a zip file"));
  var count = dv.getUint16(end + 10, true);
  var start = dv.getUint32(end + 16, true);

  var jobs = [], p = start;
  for (var n = 0; n < count; n++) {
    if (dv.getUint32(p, true) !== 0x02014B50) break;
    var method = dv.getUint16(p + 10, true);
    var csize = dv.getUint32(p + 20, true);
    var nlen = dv.getUint16(p + 28, true);
    var elen = dv.getUint16(p + 30, true);
    var clen = dv.getUint16(p + 32, true);
    var off = dv.getUint32(p + 42, true);
    var name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nlen));
    p += 46 + nlen + elen + clen;
    var keep = want(name);
    if (!keep) continue;
    jobs.push({ name: name, method: method, csize: csize, off: off, as: keep });
  }

  return jobs.reduce(function (chain, j) {
    return chain.then(function (acc) {
      // The local header's own name and extra lengths - they may differ
      // from the central directory's, and the data starts after them.
      var lnlen = dv.getUint16(j.off + 26, true);
      var lelen = dv.getUint16(j.off + 28, true);
      var from = j.off + 30 + lnlen + lelen;
      var raw = u8.subarray(from, from + j.csize);
      var got = j.method === 0 ? Promise.resolve(raw) : inflate(raw);
      return got.then(function (bytes) { acc[j.name] = bytes; return acc; });
    });
  }, Promise.resolve({}));
}
function inflate(bytes) {
  if (typeof DecompressionStream === "undefined")
    return Promise.reject(new Error(
      "this browser cannot unzip - open the page in Chrome or Edge"));
  var ds = new DecompressionStream("deflate-raw");
  var w = ds.writable.getWriter();
  w.write(bytes); w.close();
  return new Response(ds.readable).arrayBuffer()
    .then(function (b) { return new Uint8Array(b); });
}

/* ------------------------------------------------------------
   READING A DDS BACK. The sheets are uncompressed A8R8G8B8 with a
   128-byte header, which is what ddsFrom writes - so this is that
   function backwards, and the byte order is the thing to get right:
   little-endian masks mean the pixels go down as B, G, R, A.
   ------------------------------------------------------------ */
function ddsToImageData(bytes) {
  var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (dv.getUint32(0, true) !== 0x20534444) return null;   // "DDS "
  var h = dv.getUint32(12, true), w = dv.getUint32(16, true);
  var fourcc = dv.getUint32(84, true);
  if (fourcc !== 0) return null;                           // compressed - not ours
  var need = 128 + w * h * 4;
  if (bytes.length < need) return null;
  var out = new Uint8ClampedArray(w * h * 4);
  for (var i = 0, o = 128; i < out.length; i += 4, o += 4) {
    out[i] = bytes[o + 2]; out[i + 1] = bytes[o + 1];
    out[i + 2] = bytes[o]; out[i + 3] = bytes[o + 3];
  }
  return new ImageData(out, w, h);
}
/* One item's picture, cut out of a sheet at the rectangle its section
   names, as a PNG data url - the same shape the bench holds every
   other picture in. */
function cutIcon(img, rect) {
  if (!img || !rect || !rect.w || !rect.h) return null;
  var cv = document.createElement("canvas");
  cv.width = rect.w * CELL; cv.height = rect.h * CELL;
  var cx = cv.getContext("2d");
  var full = document.createElement("canvas");
  full.width = img.width; full.height = img.height;
  full.getContext("2d").putImageData(img, 0, 0);
  cx.drawImage(full, rect.x * CELL, rect.y * CELL, cv.width, cv.height,
               0, 0, cv.width, cv.height);
  return cv.toDataURL("image/png");
}

/* ------------------------------------------------------------
   READING THE MOD, which is mkseed.py's job done in a browser.

   ONE SOURCE PER FACT, the same rule as there: slot counts and layouts
   come out of the SHIPPED system file rather than the balance file,
   because the system file is what the game reads and the two have
   differed before. Names come out of the English xml. Prices come out
   of the section.
   ------------------------------------------------------------ */
var G = "gamedata/";
var WANTED = [
  "configs/mod_system_amp_rigs.ltx",
  "configs/mod_system_amp_boxes.ltx",
  "configs/mod_system_amp_pouches.ltx",
  "configs/mod_system_zzz_amp_adopted.ltx",
  "configs/items/amp_boxes.ltx",
  "configs/mod_sortingplus_amp.ltx",
  "configs/magazines/outfitloadouts/l_amp_rigs.ltx",
  "configs/items/settings/mod_craft_amp_rigs.ltx",
  "configs/items/settings/mod_craft_zzz_amp_magpouch.ltx",
  "configs/items/settings/mod_parts_amp_rigs.ltx",
  // ZONE GRID'S, not this mod's - the two ship in one gamedata folder.
  "configs/items/settings/zzz_grid_packs.ltx",
  // The Item editor's two, both shipped empty.
  "configs/mod_system_zzz_amp_items.ltx",
  "configs/items/settings/mod_craft_zzz_amp_items.ltx",
  "configs/items/settings/mod_grok_items_tier_amp.ltx",
  "configs/items/settings/mod_grok_treasure_manager_amp.ltx",
  "configs/items/settings/mod_death_items_amp.ltx",
  "configs/text/eng/zzz_amp_text.xml",
  "configs/text/rus/zzz_amp_text.xml",
  "configs/text/spa/zzz_amp_text.xml",
  "configs/text/ukr/zzz_amp_text.xml",
  "scripts/zzz_armor_mag_pouches.script"
];
var SHEETS = ["ui_amp_rigs", "ui_amp_boxes", "ui_amp_pouches", "ui_amp_items"];

function sectionsOf(text) {
  var out = {}, cur = null;
  text.split(/\r?\n/).forEach(function (line) {
    line = line.split(";")[0];
    var m = line.match(/^\s*!?\[([\w.]+)\]/);
    if (m) { cur = m[1]; out[cur] = out[cur] || {}; return; }
    if (!cur) return;
    var k = line.match(/^\s*([\w$]+)\s*=\s*(.*?)\s*$/);
    if (k) out[cur][k[1]] = k[2];
  });
  return out;
}
function stringsOf(xml) {
  var out = {}, re =
    /<string id="st_(\w+?)_(name|descr)">\s*<text>([\s\S]*?)<\/text>/g, m;
  while ((m = re.exec(xml))) {
    out[m[1]] = out[m[1]] || {};
    out[m[1]][m[2]] = m[3].replace(/\s+/g, " ").trim();
  }
  return out;
}
function rectOf(s) {
  if (s.inv_grid_width == null) return null;
  return { x: +(s.inv_grid_x || 0), y: +(s.inv_grid_y || 0),
           w: +s.inv_grid_width, h: +s.inv_grid_height };
}
function layoutOf(s) {
  if (!s.amp_layout) return { band: 0, pins: [] };
  var bits = s.amp_layout.split(":");
  var pins = [];
  (bits[1] || "").split(/[|;,]/).forEach(function (tok) {
    var m = tok.trim().match(/^(\d+x\d+)@(\d+)\.(\d+)$/);
    if (m) pins.push({ kind: m[1], col: +m[2], row: +m[3] });
  });
  return { band: +bits[0] || 0, pins: pins };
}

/* Everything the bench needs, out of one unzipped mod. */
function readMod(files, sheetImgs) {
  var txt = {};
  Object.keys(files).forEach(function (n) {
    if (/\.(ltx|xml|script)$/.test(n))
      txt[n.slice(G.length)] = new TextDecoder("utf-8").decode(files[n]);
  });
  // THE RUSSIAN FILE IS windows-1251 and TextDecoder can say so.
  if (files[G + "configs/text/rus/zzz_amp_text.xml"])
    txt["configs/text/rus/zzz_amp_text.xml"] = new TextDecoder("windows-1251")
      .decode(files[G + "configs/text/rus/zzz_amp_text.xml"]);

  /* A FILE AN OLDER BUILD DOES NOT HAVE YET falls back to the copy
     this page was built with, rather than to nothing. Each of these is
     mostly the explanation of what it is for, and starting one blank
     would quietly throw all of that away the first time somebody
     updated from a zip that predates it. */
  var SOFT = ["configs/mod_system_amp_pouches.ltx",
              "configs/mod_system_zzz_amp_adopted.ltx",
              "configs/items/amp_boxes.ltx",
              "configs/mod_sortingplus_amp.ltx",
              "configs/items/settings/mod_craft_zzz_amp_magpouch.ltx",
              "configs/items/settings/mod_parts_amp_rigs.ltx",
              "configs/items/settings/zzz_grid_packs.ltx",
              "configs/mod_system_zzz_amp_items.ltx",
              "configs/items/settings/mod_craft_zzz_amp_items.ltx"];

  var missing = WANTED.filter(function (p) {
    return txt[p] == null && SOFT.indexOf(p) < 0;
  });
  if (missing.length)
    throw new Error("that zip is missing " + missing[0]
      + " - is it a Squared Away build?");

  SOFT.forEach(function (p) {
    if (txt[p] == null) txt[p] = (root.SEED && root.SEED.files
      && root.SEED.files[p]) || "";
  });

  /* THE TWO PARTS LISTS, from the file that holds both. They are
     independent - item_parts reads nor_parts_list and ui_workshop
     reads con_parts_list - so they are read as two. */
  var partsTxt = txt["configs/items/settings/mod_parts_amp_rigs.ltx"] || "";
  var partsOf = function (section, sec) {
    var m = partsTxt.match(new RegExp("^!\\[" + section + "\\]([\\s\\S]*?)(?=^!?\\[|(?![\\s\\S]))", "m"));
    if (!m) return [];
    var body = m[1].split(/\r?\n/)
      .filter(function (l) { return l.replace(/^\s+/, "").charAt(0) !== ";"; })
      .join("\n");
    var hit = body.match(new RegExp("^" + sec + "[^\\S\\r\\n]*=[^\\S\\r\\n]*(.*)$", "m"));
    if (!hit) return [];
    return hit[1].split(",").map(function (x) { return x.trim(); })
      .filter(function (x) { return x !== ""; });
  };

  var names = stringsOf(txt["configs/text/eng/zzz_amp_text.xml"]);
  var rigsys = sectionsOf(txt["configs/mod_system_amp_rigs.ltx"]);
  var boxsys = sectionsOf(txt["configs/mod_system_amp_boxes.ltx"]);
  var pouchsys = sectionsOf(txt["configs/mod_system_amp_pouches.ltx"]);
  var pick = function (id, k, d) { return (names[id] && names[id][k]) || d; };
  var icon = function (s) {
    var tex = String(s.icons_texture || "").replace(/\\/g, "/").split("/").pop();
    return cutIcon(sheetImgs[tex], rectOf(s));
  };

  var rigs = [];
  Object.keys(rigsys).forEach(function (id) {
    var s = rigsys[id];
    if (s.amp_slot_2x2 == null) return;
    var lay = layoutOf(s);
    rigs.push({ id: id, name: pick(id, "name", id), descr: pick(id, "descr", ""),
      weight: +s.inv_weight || 0, cost: +s.cost || 0, tier: +s.amp_rig_tier || 1,
      slots: { "2x2": +s.amp_slot_2x2 || 0, "3x1": +s.amp_slot_3x1 || 0,
               "2x1": +s.amp_slot_2x1 || 0, "1x1": +s.amp_slot_1x1 || 0 },
      band: lay.band, pins: lay.pins, icon: icon(s), rect: rectOf(s),
      cellw: Math.round((+s.inv_grid_width || 4) / 2),
      cellh: Math.round((+s.inv_grid_height || 6) / 2),
      // HOW IT IS MENDED, read off the section like everything else -
      // so a newer mod that retunes a rig's repair brings that with it.
      repair: s.repair_type || "outfit_light",
      repairBonus: s.repair_part_bonus == null ? null : +s.repair_part_bonus,
      /* ...AND WHAT IT IS MADE OF, out of the parts file. Left out, the
         rigs came back with no lists, the emitter wrote its worked-out
         defaults over sixteen hand-tuned lines, and a build that
         changed nothing rewrote the file. Caught by the one test that
         asks for exactly that. */
      parts: partsOf("con_parts_list", id),
      "yield": partsOf("nor_parts_list", id),
      new: false });
  });
  rigs.sort(function (a, b) { return a.tier - b.tier || a.cost - b.cost; });

  var boxes = [];
  Object.keys(boxsys).forEach(function (id) {
    var s = boxsys[id];
    if (s.amp_box_takes == null) return;
    var borrowed = id.indexOf("ampbox_") !== 0;
    boxes.push({ id: id, borrowed: borrowed,
      name: pick(id, "name", borrowed ? "Wallet" : id),
      descr: pick(id, "descr", ""),
      weight: +s.inv_weight || 0, cost: +s.cost || 0,
      takes: s.amp_box_takes || "any", snd: s.amp_box_snd || "chest",
      inw: +s.amp_box_w || 1, inh: +s.amp_box_h || 1,
      kg: (String(s.amp_box_noweight).toLowerCase() === "true") ? null
        : (s.amp_box_kg == null ? null : +s.amp_box_kg),
      stack: +s.amp_box_stack || 1,
      cellw: Math.round((+s.inv_grid_width || 4) / 2),
      cellh: Math.round((+s.inv_grid_height || 4) / 2),
      icon: icon(s), rect: rectOf(s), shelves: {}, new: false });
  });
  boxes.sort(function (a, b) {
    return (a.borrowed ? 1 : 0) - (b.borrowed ? 1 : 0) || a.cost - b.cost;
  });
  readShelves(txt, boxes);

  // The three the magazine mod owns, then any this mod has grown.
  var pouches = [
    { id: "af_magpouch_s", name: "Small mag pouch", tier: 2, weight: 0.2,
      cost: 1500, grants: { "2x2": 0, "3x1": 0, "2x1": 1, "1x1": 0 } },
    { id: "af_magpouch_m", name: "Medium mag pouch", tier: 3, weight: 0.3,
      cost: 2800, grants: { "2x2": 0, "3x1": 0, "2x1": 2, "1x1": 0 } },
    { id: "af_magpouch_l", name: "Large mag pouch", tier: 4, weight: 0.4,
      cost: 4500, grants: { "2x2": 1, "3x1": 0, "2x1": 0, "1x1": 0 } }
  ].map(function (p) { p.icon = null; p.cellw = 2; p.cellh = 2; p.new = false; return p; });
  var tiers = sectionsOf(txt["configs/items/settings/mod_grok_items_tier_amp.ltx"]);
  pouches.forEach(function (p) {
    if (tiers[p.id] && tiers[p.id].tier != null) p.tier = +tiers[p.id].tier;
  });
  Object.keys(pouchsys).forEach(function (id) {
    var s = pouchsys[id];
    if (s.amp_pouch == null) return;
    pouches.push({ id: id, name: pick(id, "name", id), descr: pick(id, "descr", ""),
      weight: +s.inv_weight || 0, cost: +s.cost || 0,
      tier: +s.amp_pouch_tier || 3,
      grants: { "2x2": +s.amp_pgrant_2x2 || 0, "3x1": +s.amp_pgrant_3x1 || 0,
                "2x1": +s.amp_pgrant_2x1 || 0, "1x1": +s.amp_pgrant_1x1 || 0 },
      icon: icon(s), rect: rectOf(s),
      cellw: Math.round((+s.inv_grid_width || 4) / 2),
      cellh: Math.round((+s.inv_grid_height || 4) / 2), new: false });
  });

  // ...and whatever this build had already adopted, so a round trip
  // through a zip does not quietly drop somebody's overrides.
  var adoptSys = sectionsOf(txt["configs/mod_system_zzz_amp_adopted.ltx"]);
  Object.keys(adoptSys).forEach(function (id) {
    var s = adoptSys[id];
    if (s.amp_pouch != null) {
      pouches.push({ id: id, name: id, adopt: true, new: true,
        tier: +s.amp_pouch_tier || 3, weight: 0, cost: 0, icon: null,
        grants: { "2x2": +s.amp_pgrant_2x2 || 0, "3x1": +s.amp_pgrant_3x1 || 0,
                  "2x1": +s.amp_pgrant_2x1 || 0, "1x1": +s.amp_pgrant_1x1 || 0 } });
    } else if (s.amp_box != null) {
      boxes.push({ id: id, name: id, adopt: true, new: true,
        takes: s.amp_box_takes || "any", snd: s.amp_box_snd || "chest",
        inw: +s.amp_box_w || 1, inh: +s.amp_box_h || 1,
        kg: (String(s.amp_box_noweight).toLowerCase() === "true") ? null
        : (s.amp_box_kg == null ? null : +s.amp_box_kg),
        stack: +s.amp_box_stack || 1, weight: 0, cost: 0,
        cellw: 2, cellh: 2, icon: null });
    }
  });

  var craftTxt = txt["configs/items/settings/mod_craft_amp_rigs.ltx"];
  var order = [];
  var byName = {}; rigs.forEach(function (r) { byName[r.name] = r.id; });
  (craftTxt.match(/^; \S[^\r\n]*?\s+\d 2x2/gm) || []).forEach(function (l) {
    var nm = l.replace(/^; /, "").replace(/\s+\d 2x2[\s\S]*$/, "").trim();
    if (byName[nm]) order.push(byName[nm]);
  });

  return { rigs: rigs, boxes: boxes, pouches: pouches, files: txt,
           // HOW MUCH ROOM EACH BACKPACK GIVES, out of Zone Grid's own
           // overrides file. Three blocks: the arithmetic every pack
           // nobody listed is worked out from, and the by-kind and
           // by-section lists for the ones somebody had an opinion on.
           packs: EMIT.readPacks(
             txt["configs/items/settings/zzz_grid_packs.ltx"] || ""),
           craftOrder: order, version: readVersion(txt) };
}
function readVersion(txt) {
  var m = (txt["scripts/zzz_armor_mag_pouches.script"] || "")
    .match(/local VERSION = "([^"]+)"/);
  return m ? m[1] : "unknown";
}
/* Who stocks what, read back off the shelf files rather than assumed. */
function readShelves(txt, boxes) {
  var by = {}; boxes.forEach(function (b) { by[b.id] = b; });
  Object.keys(txt).forEach(function (path) {
    if (path.indexOf("configs/items/trade/") !== 0) return;
    var f = path.split("/").pop().replace(/^mod_/, "").replace(/_amp\.ltx$/, "");
    var shelf = null;
    for (var k in EMIT.SHELF_FILES)
      if (EMIT.SHELF_FILES[k].indexOf(f) >= 0) shelf = k;
    if (!shelf) return;
    var re = /^(ampbox_\w+)\s+=\s*(\d+)\s*,\s*([\d.]+)/gm, m;
    while ((m = re.exec(txt[path]))) {
      if (!by[m[1]]) continue;
      by[m[1]].shelves[shelf] = { count: +m[2], chance: Math.round(+m[3] * 100) };
    }
  });
}

/* ------------------------------------------------------------
   THE WHOLE JOURNEY: a zip in, everything the bench knows out.
   ------------------------------------------------------------ */
function learnFromZip(buf, say) {
  say = say || function () {};
  say("Opening the zip...");
  var want = function (name) {
    if (name.indexOf(G) !== 0) return false;
    var rel = name.slice(G.length);
    if (WANTED.indexOf(rel) >= 0) return true;
    if (/^configs\/items\/trade\/.*_amp\.ltx$/.test(rel)) return true;
    // The sheets, and ONLY ours - a Squared Away zip also carries
    // ui_actor_menu.dds at sixty megabytes, and inflating that to find
    // out it is not wanted costs more than all the rest together.
    var m = rel.match(/^textures\/ui\/(ui_amp_\w+)\.dds$/);
    return !!(m && SHEETS.indexOf(m[1]) >= 0);
  };
  return unzip(buf, want).then(function (files) {
    say("Reading the pictures...");
    var imgs = {};
    Object.keys(files).forEach(function (n) {
      var m = n.match(/textures\/ui\/(ui_amp_\w+)\.dds$/);
      if (m) imgs[m[1]] = ddsToImageData(files[n]);
    });
    say("Reading the configs...");
    return readMod(files, imgs);
  });
}
root.BUILD = {
  CELL: CELL, ATLAS: ATLAS,
  rigSheetPlan: rigSheetPlan, boxSheetPlan: boxSheetPlan,
  pouchSheetPlan: pouchSheetPlan, itemSheetPlan: itemSheetPlan,
  composeSheet: composeSheet, ddsFrom: ddsFrom,
  cp1251: cp1251, utf8: utf8, crc32: crc32, zip: zip,
  unzip: unzip, ddsToImageData: ddsToImageData, cutIcon: cutIcon,
  fitRect: fitRect,
  pictureData: pictureData,
  sheetSize: sheetSize, fitPicture: fitPicture, paintSheet: paintSheet,
  readMod: readMod, learnFromZip: learnFromZip, WANTED: WANTED
};
})(typeof globalThis !== "undefined" ? globalThis : this);

