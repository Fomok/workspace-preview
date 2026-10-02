
/* ============================================================
   EMIT - the bench writes the mod's own files.

   TWO WAYS TO WRITE A FILE, AND ONLY ONE OF THEM IS SAFE HERE.

   The build's generators in art/ write these files from nothing. This
   cannot: it does not have their prose - the sentence explaining what
   each rig is FOR, the banner over each tier - and a file regenerated
   without it comes back correct and stripped of every reason anybody
   made a decision.

   So nothing here rewrites a file. Each emitter finds the values it
   owns inside the file that ships and puts new ones in their place,
   keeping the column the value was written in. Everything it does not
   understand survives untouched, which is the property that matters
   when the alternative is a config the game silently mis-parses.

   The exceptions are the two comment TABLES - the recipe header and
   the loot header - which tabulate every rig's numbers. Those are
   mechanical, they are the numbers being changed, and a table that
   still lists the old ones is the drift this project exists to stop.
   They are rebuilt, in the generators' own format.

   THE ACCEPTANCE TEST IS BYTE EQUALITY: verify.js feeds these the
   untouched bench and demands the files that ship, character for
   character. Everything the game reads is CRLF.
   ============================================================ */
(function (root) {
"use strict";

var NL = "\r\n";
function pad(s, n) { s = String(s); while (s.length < n) s += " "; return s; }
function lines(a) { return a.join(NL); }

/* ==========================================================
   WRITE BACK THE LINE ENDING THE FILE CAME WITH

   Everything composed here is joined with CRLF, and the comment above
   says that is what the game reads. It is what most of these files
   are - and two of them are not: the script and the box system file
   ship with plain newlines.

   So regenerating a block inside one of those put CRLF lines into an
   LF file. The game does not care. The CHECK does, and was right to:
   verify_adopt asks whether an adopted item that should touch nothing
   leaves every file byte for byte, and got back 1,366 lines differing
   by an invisible character. That is not a small complaint - it is
   the difference between a guarantee and a thing nobody can test.

   One line in, one line out. Identity when the file already agrees,
   which is why nothing else moves.
   ========================================================== */
function keepNL(src, out) {
  if (typeof src !== "string" || typeof out !== "string") return out;
  var crlf = src.indexOf("\r\n") >= 0;
  out = out.replace(/\r\n/g, "\n");
  return crlf ? out.replace(/\n/g, "\r\n") : out;
}
function esc(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

/* ------------------------------------------------------------
   THE ARITHMETIC, ported from art/mkloot.py and art/mkcraft.py.
   ------------------------------------------------------------ */
var KINDS = ["2x2", "3x1", "2x1", "1x1"];
var CELLS = { "2x2": 4, "3x1": 3, "2x1": 2, "1x1": 1 };
var WORTH = { "1x1": 1.0, "2x1": 2.2, "3x1": 3.4, "2x2": 4.8 };
var BANDS = [[12.5, 1], [17.0, 2], [21.0, 3], [26.0, 4]];
var CAP_COMMON = 3, CAP_RARE = 4;
var FOLD = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 3 };
var BOOK = { 1: "recipe_basic_0", 2: "recipe_basic_1", 3: "recipe_advanced_1" };
var CRAFT_T = { 1: 1, 2: 2, 3: 2 };
var FABRIC = { 1: "prt_o_fabrics_1", 2: "prt_o_fabrics_3", 3: "prt_o_fabrics_4" };
var BASE_FABRIC = { 1: 4, 2: 6, 3: 8 };
var THREAD_BASE = { 1: 4, 2: 6, 3: 8 }, THREAD_PER = 2;

function cellsOf(s) { var t = 0; KINDS.forEach(function (k) { t += CELLS[k] * (s[k] || 0); }); return t; }
/* SUMMED SMALLEST FIRST, and that is not a style choice. Two rigs can
   be worth 26.8 by hand and differ in the last bits of a double - the
   Tarzan and the Leshy do - and the loot table is sorted by that
   number. Add the same four terms in a different order and those two
   swap places in the shipped file. This is art/mkloot.py's own order:
   the WORTH dict, as written. */
var WORTH_ORDER = ["1x1", "2x1", "3x1", "2x2"];
function worthOf(s) {
  var t = 0;
  WORTH_ORDER.forEach(function (k) { t += WORTH[k] * (s[k] || 0); });
  return t;
}
function tierOf(s) {
  var w = worthOf(s);
  for (var i = 0; i < BANDS.length; i++) if (w <= BANDS[i][0]) return BANDS[i][1];
  return 5;
}
function where(t) {
  if (t <= CAP_COMMON) return "common and rare stashes";
  if (t <= CAP_RARE) return "rare stashes only";
  return "NOT FOUND AT ALL - craft only, at the mod's default caps";
}
function recipeOf(slots) {
  var tier = FOLD[tierOf(slots)];
  var rem = {}; KINDS.forEach(function (k) { rem[k] = slots[k] || 0; });
  var P = [["large", "af_magpouch_l", "2x2", 1],
           ["medium", "af_magpouch_m", "2x1", 2],
           ["small", "af_magpouch_s", "2x1", 1]];
  var n = {};
  P.forEach(function (p) { n[p[0]] = Math.floor(rem[p[2]] / p[3]); rem[p[2]] -= n[p[0]] * p[3]; });
  var chosen = P.filter(function (p) { return n[p[0]] > 0; }).slice(0, 2)
                .map(function (p) { return p[0]; });
  var parts = [], pouches = 0;
  P.forEach(function (p) {
    if (chosen.indexOf(p[0]) >= 0) { parts.push([p[1], n[p[0]]]); pouches += n[p[0]]; }
    else rem[p[2]] += n[p[0]] * p[3];
  });
  var leftover = 0; KINDS.forEach(function (g) { leftover += CELLS[g] * rem[g]; });
  parts.push(["sewing_thread", THREAD_BASE[tier] + THREAD_PER * pouches]);
  parts.push([FABRIC[tier], BASE_FABRIC[tier] + leftover]);
  return { tier: tier, book: BOOK[tier], parts: parts, pouches: pouches, leftover: leftover };
}
/* WHAT A RIG COSTS - the worked-out answer, or the one you wrote.

     "change crafting changes in Rig TAB to look like those in pouches
      ... Instead of typing in a list od Items that looks like its an
      information for you not a real working thing."

   Right, and it was: the rig card SHOWED the derivation and the only
   way to disagree with it was a note in prose for me to read. The
   derivation is still the default and still the balance - it is what a
   new rig gets and what "back to the worked-out one" returns to - but
   it is now a starting point rather than a verdict.

   ONE SHAPE FOR BOTH KINDS. `kit` is the toolkit number the line
   actually carries, so the derived answer is folded through CRAFT_T
   here and nowhere else - the pouches already stored theirs that way
   and two meanings for one field is how a recipe comes out a tier
   wrong. */
function rigRecipe(r) {
  var own = r && r.craft;
  if (own && own.parts && own.parts.length) {
    return { kit: own.kit, book: own.book,
             parts: own.parts.map(function (x) { return [x[0], x[1]]; }),
             derived: false };
  }
  var rec = recipeOf(r.slots);
  return { kit: CRAFT_T[rec.tier], book: rec.book, parts: rec.parts,
           derived: true, tier: rec.tier,
           pouches: rec.pouches, leftover: rec.leftover };
}
function craftLine(r) {
  var rec = rigRecipe(r);
  var body = rec.parts.map(function (p) { return p[0] + "," + p[1]; }).join(",");
  return "x_" + pad(r.id, 22) + " = " + rec.kit + ", " + rec.book + "," + body;
}
/* ui_workshop parses each line into at most four ingredients and drops
   the whole recipe if there are more - without saying so. mkcraft.py
   stops dead on that; so does this. */
function craftFields(r) {
  return craftLine(r).split("=")[1].trim().split(",").length;
}
function layoutStr(r) {
  return r.band + ":" + r.pins.map(function (p) {
    return p.kind + "@" + p.col + "." + p.row;
  }).join("|");
}

/* ------------------------------------------------------------
   THE SPLICER. Everything below is one of these three moves.
   ------------------------------------------------------------ */
/* Replace `key = value` inside [section], keeping the column the value
   was written in - these files are aligned by hand and a value that
   jumps left is a diff nobody can read. Returns the text unchanged if
   the section or the key is not there, because an emitter that INVENTS
   a key is an emitter that can put one in the wrong section. */
/* ==========================================================
   THE COMPARTMENTS, AS ONE LINE

     amp_box_slots = 1,1,2,1 | 4,1,2,1 | 1,3,2,1

   across,down,wide,tall, one-based from the top-left square. An empty
   list writes NOTHING, because nothing is what one open area is - and
   that matters more than it looks: a box whose compartments were taken
   away must lose the key, not carry an empty one, or a reader that
   sees the key and reads no rectangles has to guess which was meant.

   READ ACROSS THEN DOWN, sorted, so two people who draw the same box
   in a different order produce the same line and the same diff.
   ========================================================== */
/* IS THIS LIST JUST "ONE PER SQUARE"? Then it has a shorter name, and
   the shorter name is what the file already says.

   WITHOUT THIS, A BUILD THAT CHANGED NOTHING REWROTE THE HIP POUCH -
   fifteen 1x1 rectangles spelled out where `amp_box_cells = true` had
   been. The same box, and a file that moves when nothing moved: every
   check that rests on "untouched in, untouched out" went red, and they
   are right to. That property is what makes a diff worth reading.
*/
function slotsAreCells(b) {
  var list = (b && Array.isArray(b.slots)) ? b.slots : [];
  var w = b.inw || 1, h = b.inh || 1;
  if (list.length !== w * h) return false;
  return list.every(function (s) { return s.w === 1 && s.h === 1; });
}

function slotLine(b) {
  var list = (b && Array.isArray(b.slots)) ? b.slots.slice() : [];
  list.sort(function (a, z) { return (a.r - z.r) || (a.c - z.c); });
  return list.map(function (s) {
    return [s.c, s.r, s.w, s.h].join(",");
  }).join(" | ");
}

function setKey(text, section, key, value) {
  var re = new RegExp("(^!?\\[" + esc(section) + "\\][^\\[]*?^)(" + esc(key) +
                      "(\\s*))=([^\r\n]*)", "m");
  return text.replace(re, function (all, head, k, sp, old) {
    // A VALUE THAT HAS NOT CHANGED IS NOT REWRITTEN. These files are
    // written the way a person writes them - 2.0 here, 2 there - and
    // normalising every line the emitter walks past turns a one-line
    // edit into a diff nobody will read. Compared as numbers when both
    // are numbers, so 2.0 and 2 are the same answer.
    var o = old.trim(), n = String(value);
    if (o === n) return all;
    if (o !== "" && n !== "" && isFinite(o) && isFinite(n) && Number(o) === Number(n))
      return all;
    return head + k + "= " + n;
  });
}
function hasSection(text, section) {
  return new RegExp("^!?\\[" + esc(section) + "\\]", "m").test(text);
}
function hasKey(text, section, key) {
  var re = new RegExp("^!?\\[" + esc(section) + "\\][^\\[]*?^" + esc(key) + "\\s*=", "m");
  return re.test(text);
}
function getSection(text, section) {
  // (?![\s\S]) IS THE END OF THE TEXT. `$` under /m ends at the first
  // line break, so this used to return the section's first line and a
  // cloned rig arrived with nothing on it.
  var re = new RegExp("^(!?\\[" + esc(section) + "\\][\\s\\S]*?)(?=^!?\\[|(?![\\s\\S]))", "m");
  var m = text.match(re);
  return m ? m[1] : null;
}
/* Drop a key that should no longer be there - used when a rig loses
   its drawn layout and goes back to being packed automatically. A
   stale amp_layout is worse than none: it names pockets the counts no
   longer declare, the game refuses it, and the rig quietly reverts. */
function dropKey(text, section, key) {
  var re = new RegExp("(^!?\\[" + esc(section) + "\\][^\\[]*?)^" + esc(key) +
                      "\\s*=[^\r\n]*\r?\n", "m");
  return text.replace(re, "$1");
}
/* A NEW ITEM IS A COPY OF ONE THAT WORKS. Every field on these
   sections beyond the handful the bench edits is the artefact
   template's own - the visual, the particles, the attach offsets - and
   inventing them is how a section that looks right refuses to spawn. */
function cloneSection(text, fromId, toId) {
  var body = getSection(text, fromId);
  if (!body) return null;
  return body.replace(new RegExp(esc(fromId), "g"), toId);
}
function appendSection(text, body) {
  return text.replace(/\s*$/, NL + NL) + body.replace(/\s*$/, NL);
}
function removeSection(text, section) {
  var re = new RegExp("(?:^;[^\r\n]*\r?\n)*^!?\\[" + esc(section) +
                      "\\][\\s\\S]*?(?=^!?\\[|$)", "m");
  return text.replace(re, "");
}

/* ------------------------------------------------------------
   1. mod_system_amp_rigs.ltx - what the game reads about a rig
   ------------------------------------------------------------ */
function rigSystem(db, tpl, sheet) {
  var t = tpl;
  (db.removed || []).forEach(function (x) {
    if (x.kind === "rigs") t = removeSection(t, x.id);
  });
  ourRigs(db).forEach(function (r) {
    if (!hasSection(t, r.id)) {
      var body = cloneSection(t, db.rigs[0].id, r.id);
      if (!body) return;
      t = appendSection(t, body);
    }
    t = setKey(t, r.id, "amp_rig_tier", tierOf(r.slots));
    KINDS.forEach(function (k) { t = setKey(t, r.id, "amp_slot_" + k, r.slots[k] || 0); });
    if (r.pins && r.pins.length) {
      if (hasKey(t, r.id, "amp_layout")) t = setKey(t, r.id, "amp_layout", layoutStr(r));
      else t = addKeyAfter(t, r.id, "amp_slot_1x1", "amp_layout", layoutStr(r));
    } else t = dropKey(t, r.id, "amp_layout");
    t = setKey(t, r.id, "inv_weight", fixw(r.weight));
    t = setKey(t, r.id, "cost", Math.round(r.cost));
    t = repairKeys(t, r.id, r);
    var rect = sheet && sheet[r.id];
    if (rect) {
      t = setKey(t, r.id, "inv_grid_x", rect.x);
      t = setKey(t, r.id, "inv_grid_y", rect.y);
      t = setKey(t, r.id, "inv_grid_width", rect.w);
      t = setKey(t, r.id, "inv_grid_height", rect.h);
    }
  });
  return t;
}
/* ------------------------------------------------------------
   HOW A RIG IS MENDED

     "add options for rigs to change what they are repaired with for
      ours/new/adopted"

   Two keys, and between them they are the whole of the repair wiring.
   `repair_type` is a name a kit claims: a kit declares
   `repair_only = ... outfit_light ...` and the game's own machinery
   does the rest - the minimum condition it will work at, the parts
   window, all of it. `repair_part_bonus` is how much one part puts
   back.

   Every rig ships `outfit_light`, which is not arbitrary: a type
   nobody lists is a rig no kit will touch, and light armour is already
   served by every sewing kit and cloth glue in the game. Making one
   `outfit_exo` is a real decision - it means only the kits that mend
   exoskeletons will mend that rig - and it is now yours to make.

   AND A NUMBER THE LADDER SUGGESTS RATHER THAN IMPOSES. All sixteen
   follow tier 1-2 -> 0.05, 3 -> 0.07, 4-5 -> 0.09; the bench offers
   that and lets you type something else.
   ------------------------------------------------------------ */
var REPAIR_BONUS = { 1: 0.05, 2: 0.05, 3: 0.07, 4: 0.09, 5: 0.09 };
function bonusFor(slots) { return REPAIR_BONUS[tierOf(slots)] || 0.05; }
/* WRITTEN ONLY WHERE THE SECTION ALREADY HAS THE KEY, or after
   use_condition where it does not. A rig with no repair_type at all is
   a rig no kit will touch, so an emitter that silently skipped the key
   on a section cloned without one would make an unmendable rig - and
   nothing about that shows up until somebody's rig is at 40% and no
   kit in the game will look at it. */
function repairKeys(t, id, r) {
  if (r.repair) {
    if (hasKey(t, id, "repair_type")) t = setKey(t, id, "repair_type", r.repair);
    else t = addKeyAfter(t, id, "use_condition", "repair_type", r.repair);
  }
  var b = (r.repairBonus == null) ? bonusFor(r.slots) : Number(r.repairBonus);
  if (isFinite(b)) {
    var v = (Math.round(b * 1000) / 1000).toString();
    if (hasKey(t, id, "repair_part_bonus")) t = setKey(t, id, "repair_part_bonus", v);
    else t = addKeyAfter(t, id, "repair_type", "repair_part_bonus", v);
  }
  return t;
}

function addKeyAfter(text, section, afterKey, key, value) {
  var re = new RegExp("(^!?\\[" + esc(section) + "\\][^\\[]*?^" + esc(afterKey) +
                      "(\\s*)=[^\r\n]*\r?\n)", "m");
  return text.replace(re, function (all, head, sp) {
    return head + pad(key, afterKey.length + sp.length) + "= " + value + NL;
  });
}
/* The weight fields are written the way a person writes them - 2 not
   2.0, 1.5 not 1.50 - and matching that keeps the diff to the lines
   that actually changed. */
function fixw(n) {
  n = Number(n) || 0;
  return (Math.round(n * 100) / 100).toString();
}

/* ------------------------------------------------------------
   2. mod_system_amp_boxes.ltx
   ------------------------------------------------------------ */
function boxSystem(db, tpl, sheet) {
  var t = tpl;
  var __src = tpl;
  (db.removed || []).forEach(function (x) {
    if (x.kind === "boxes") t = removeSection(t, x.id);
  });
  db.boxes.forEach(function (b) {
    if (b.adopt) return;              // an override, written elsewhere

    /* ============================================================
       A BORROWED SECTION IS NEVER DECLARED HERE. EVER.

         [DLTX] Duplicate section 'cash' wasn't marked as an override.
         file with section "items_money.ltx",
         file with duplicate "mod_system_amp_boxes.ltx"

       A crash on startup with nothing else in the log, and this line
       is the whole of it.

       `borrowed` means THE GAME ALREADY DEFINES THIS SECTION - [cash]
       is the base game's money, which this mod once bolted a pocket
       onto. The mod stopped doing that, so the section left our file;
       but a bench that has been open since before then still has the
       wallet in its list, found no [cash] to patch, and did what it
       does for a box it cannot find: cloned another one and gave the
       copy that name.

       That writes `[cash]` - a DECLARATION - into a file that also
       loads the game's own `[cash]`. DLTX will not have two, and it
       says so and stops. (It would also have made money into a kevlar
       artefact, which is the smaller problem.)

       There is no sensible thing to invent here: an item the game owns
       either exists to be patched or is not ours to make. So it is
       skipped, and named, and the Check tab says so before a build
       rather than the game saying so afterwards.
       ============================================================ */
    if (!hasSection(t, b.id)) {
      if (b.borrowed) { (db.skipped || (db.skipped = [])).push(b.id); return; }
      var from = db.boxes.filter(function (o) { return !o.borrowed && hasSection(t, o.id); })[0];
      var body = from && cloneSection(t, from.id, b.id);
      if (!body) return;
      t = appendSection(t, body);
    }
    t = setKey(t, b.id, "amp_box_takes", b.takes);
    t = setKey(t, b.id, "amp_box_snd", b.snd);
    t = setKey(t, b.id, "amp_box_w", b.inw);
    t = setKey(t, b.id, "amp_box_h", b.inh);
    t = setKey(t, b.id, "amp_box_stack", b.stack);

    /* ============================================================
       AND THE COMPARTMENTS, OR THE ABSENCE OF THEM

       DROPPED WHEN THERE ARE NONE, and amp_box_cells goes with it. The
       shorthand and the list are two spellings of one thing, so a
       section carrying both would be two answers to one question - and
       the bench edits rectangles, so the list is the one it can be
       sure it means. The hip pouch's own line is rewritten from its
       fifteen squares into the same fifteen rectangles, which is the
       same box said the other way.
       ============================================================ */
    var line = slotLine(b);
    if (line && slotsAreCells(b)) {
      /* THE SHORT SPELLING for the shape that has one. */
      if (hasKey(t, b.id, "amp_box_cells"))
        t = setKey(t, b.id, "amp_box_cells", "true");
      else
        t = addKeyAfter(t, b.id, "amp_box_takes", "amp_box_cells", "true");
      t = dropKey(t, b.id, "amp_box_slots");
    } else if (line) {
      if (hasKey(t, b.id, "amp_box_slots"))
        t = setKey(t, b.id, "amp_box_slots", line);
      else
        t = addKeyAfter(t, b.id, "amp_box_takes", "amp_box_slots", line);
      t = dropKey(t, b.id, "amp_box_cells");
    } else {
      t = dropKey(t, b.id, "amp_box_slots");
      t = dropKey(t, b.id, "amp_box_cells");
    }

    /* ============================================================
       NO CEILING IS SOMETHING THE SECTION SAYS

         "i tried to add custom box for amours, and set exactyly the
          same values the existing one had ... and the new one could
          [not] take some armours that the old one can"

       And the log said why: `box 2799: 9.90 + 12.00 is over its 10.00
       kg`. The shipped Armour Case has no weight limit at all; his had
       ten.

       THE MOD READS A FLAG, NOT AN ABSENCE. box_cap tests
       `amp_box_noweight` and returns before it ever looks at the
       kilograms; a section with NO amp_box_kg falls through to the
       default ten. This emitter expressed "no limit" by leaving the
       key out, which is the one spelling that means the opposite.

       It read right by luck - the four boxes that have no ceiling also
       have no amp_box_kg, so the bench showed them correctly - and it
       wrote wrong every time. Both halves are explicit now.
       ============================================================ */
    if (b.kg == null) {
      t = dropKey(t, b.id, "amp_box_kg");
      if (hasKey(t, b.id, "amp_box_noweight"))
        t = setKey(t, b.id, "amp_box_noweight", "true");
      else t = addKeyAfter(t, b.id, "amp_box_stack", "amp_box_noweight", "true");
    } else {
      /* TURNED OFF WHERE IT STANDS, not deleted. The four boxes that
         ship with this flag do not agree on where it sits - the
         document case keeps it ABOVE amp_box_stack and the armour case
         below - so dropping it and adding it back put it in the other
         one's place, and a build that ended up changing nothing still
         moved two lines. `= false` reads as false to SYS_GetParam and
         is an idiom this file already uses (amp_box_wt = false), so
         the key stays exactly where whoever wrote it put it. */
      if (hasKey(t, b.id, "amp_box_noweight"))
        t = setKey(t, b.id, "amp_box_noweight", "false");
      if (hasKey(t, b.id, "amp_box_kg")) t = setKey(t, b.id, "amp_box_kg", fixw(b.kg));
      else t = addKeyAfter(t, b.id, "amp_box_h", "amp_box_kg", fixw(b.kg));
    }
    if (b.borrowed) return;
    /* A BOX NOBODY SELLS SAYS SO ON ITS OWN SECTION. The mod's audit
       asks that every container be on some shelf, and takes
       `amp_box_sold = false` as the answer for one deliberately kept
       off all of them - the key exists for exactly that and nothing
       shipped has ever needed it. A bench-made container with no shelf
       ticked IS that case, and without the key it reads as an oversight
       instead of a decision. */
    if (Object.keys(b.shelves || {}).length) t = dropKey(t, b.id, "amp_box_sold");
    else if (hasKey(t, b.id, "amp_box_sold"))
      t = setKey(t, b.id, "amp_box_sold", "false");
    else t = addKeyAfter(t, b.id, "amp_box_takes", "amp_box_sold", "false");
    t = setKey(t, b.id, "inv_weight", fixw(b.weight));
    t = setKey(t, b.id, "cost", Math.round(b.cost));
    var rect = sheet && sheet[b.id];
    if (rect) {
      t = setKey(t, b.id, "inv_grid_x", rect.x);
      t = setKey(t, b.id, "inv_grid_y", rect.y);
      t = setKey(t, b.id, "inv_grid_width", rect.w);
      t = setKey(t, b.id, "inv_grid_height", rect.h);
    }
  });
  return keepNL(__src, t);
}

/* ------------------------------------------------------------
   3. l_amp_rigs.ltx - the balance file
   ------------------------------------------------------------ */
function balance(db, tpl) {
  var t = tpl;
  (db.removed || []).forEach(function (x) {
    if (x.kind === "rigs") t = removeSection(t, x.id);
  });
  ourRigs(db).forEach(function (r) {
    if (!hasSection(t, r.id)) {
      t = appendSection(t, "[" + r.id + "]" + NL +
        KINDS.map(function (k) { return pad("slot_" + k, 32) + "= " + (r.slots[k] || 0); }).join(NL));
    }
    KINDS.forEach(function (k) { t = setKey(t, r.id, "slot_" + k, r.slots[k] || 0); });
    if (r.pins && r.pins.length) {
      if (hasKey(t, r.id, "layout")) t = setKey(t, r.id, "layout", layoutStr(r));
      else t = addKeyAfter(t, r.id, "slot_1x1", "layout", layoutStr(r));
    } else t = dropKey(t, r.id, "layout");
  });
  return t;
}

/* ------------------------------------------------------------
   4. mod_craft_amp_rigs.ltx - the recipes, and the table above them
   ------------------------------------------------------------ */
function craftNotes(db) {
  return sortedByName(db).map(function (r) {
    var rec = recipeOf(r.slots), s = r.slots;
    return "; " + pad(r.name, 22) + " " + (s["2x2"] || 0) + " 2x2 / " + (s["3x1"] || 0)
      + " 3x1 / " + (s["2x1"] || 0) + " 2x1 / " + (s["1x1"] || 0) + " 1x1  ->  "
      + rec.pouches + " pouch" + (rec.pouches === 1 ? "" : "es") + ", "
      + rec.leftover + " cell" + (rec.leftover === 1 ? "" : "s") + " paid in cloth";
  });
}
/* mkcraft walks TIER, whose order is the order of mkstrings.RIGS - the
   ladder as written, cheapest first. The bench keeps that order in the
   file it read, so the file itself is the authority. */
function sortedByName(db) { return orderFrom(db, root.EMIT.craftOrder); }
function orderFrom(db, ids) {
  var by = {}, out = [];
  var all = ourRigs(db);
  all.forEach(function (r) { by[r.id] = r; });
  (ids || []).forEach(function (id) { if (by[id]) { out.push(by[id]); delete by[id]; } });
  all.forEach(function (r) { if (by[r.id]) out.push(r); });
  return out;
}
function craft(db, tpl) {
  var t = tpl;
  // the header table
  var head = tpl.match(/(?:^; [^\r\n]*->\s+\d+ pouch[^\r\n]*\r?\n)+/m);
  if (head) t = t.replace(head[0], craftNotes(db).join(NL) + NL);
  // every recipe line, rewritten in place; new rigs land in their tier
  ourRigs(db).concat((db.rigs || []).filter(function (r) {
    return owns(r, "craft");
  })).forEach(function (r) {
    var re = new RegExp("^x_" + esc(r.id) + "\\s*=[^\r\n]*", "m");
    if (re.test(t)) t = t.replace(re, craftLine(r));
    else t = t.replace(/\s*$/, NL + craftLine(r) + NL);
  });
  (db.removed || []).forEach(function (x) {
    if (x.kind !== "rigs") return;
    t = t.replace(new RegExp("^x_" + esc(x.id) + "\\s*=[^\r\n]*\r?\n", "m"), "");
    t = t.replace(new RegExp("^; " + esc(x.name) + "\\s[^\r\n]*\r?\n", "m"), "");
  });
  return t;
}

/* ------------------------------------------------------------
   5 & 6. the loot pair
   ------------------------------------------------------------ */
var POUCHES = ["af_magpouch_s", "af_magpouch_m", "af_magpouch_l"];

/* ------------------------------------------------------------
   WHAT THE BUILD IS ENTITLED TO NAME
   ------------------------------------------------------------
   An item may go into a world list only if this same build also writes
   the section that DEFINES it. Rigs and containers are ours, so a new
   one arrives with a section cloned from a working neighbour. Pouches
   are the magazine mod's: the bench can retune the three that exist,
   and it cannot create a fourth, because that needs a section in
   another mod's format and a line in this mod's Lua.

   IT USED TO WRITE THE NAME ANYWAY. A new pouch reached the death list
   and the Stash Overhaul's spawn pool and nothing else - so another
   mod's loot table was holding a section the game has never heard of,
   and a stash that rolled it would ask the engine to create an item
   that does not exist. That is not "the pouch did not turn up". That is
   a ghost put into somebody else's world tables by a tool that should
   have refused.
   ------------------------------------------------------------ */
function realPouch(p) { return POUCHES.indexOf(p.id) >= 0; }
/* RIGS THIS MOD DECLARES. An adopted one is somebody else's section
   with our keys added, so it never gets a plain [section], a string, a
   recipe, a place on our sheet or a line in our loot tables - all of
   which belong to whoever defines it. */
function ourRigs(db) {
  return (db.rigs || []).filter(function (r) { return !r.adopt; });
}
function worldItems(db) {
  /* Everything this build is entitled to put in a world list: its own
     items, and any adopted one that was explicitly told to join. An
     adopted item stays out by default because whoever owns it already
     distributes it, and adding it to ours as well would simply make it
     twice as common - but that is a default, not a rule, and the tick
     box on the page is how you say otherwise. */
  var out = ourRigs(db);
  (db.pouches || []).forEach(function (p) {
    if (p.adopt) { if (owns(p, "drops")) out.push(p); return; }
    if (realPouch(p) || POUCHES.indexOf(p.id) < 0) out.push(p);
  });
  (db.rigs || []).forEach(function (r) { if (owns(r, "drops")) out.push(r); });
  (db.boxes || []).forEach(function (b) { if (owns(b, "drops")) out.push(b); });
  return out;
}

function lootNotes(db) {
  var rows = ourRigs(db).map(function (r) {
    return { t: tierOf(r.slots), w: worthOf(r.slots), id: r.id, r: r };
  });
  rows.sort(function (a, b) {
    return a.t - b.t || a.w - b.w || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  });
  return rows.map(function (x) {
    var s = x.r.slots;
    return "; " + pad(x.r.name, 22) + " " + (s["2x2"] || 0) + "/" + (s["3x1"] || 0)
      + "/" + (s["2x1"] || 0) + "/" + (s["1x1"] || 0) + " "
      + String(cellsOf(s)).padStart(3) + " cells  worth "
      + pad(x.w.toFixed(1), 4) + " -> tier " + x.t + ", " + where(x.t);
  });
}
function lootTier(db, tpl) {
  var t = tpl;
  var head = tpl.match(/(?:^; [^\r\n]*->\s+tier \d[^\r\n]*\r?\n)+/m);
  if (head) t = t.replace(head[0], lootNotes(db).join(NL) + NL);
  (db.removed || []).forEach(function (x) {
    if (x.kind === "rigs") t = removeSection(t, x.id);
  });
  ourRigs(db).forEach(function (r) {
    if (!hasSection(t, r.id))
      t = appendSection(t, "[" + r.id + "]" + NL + pad("tier", 32) + "= " + tierOf(r.slots));
    else t = setKey(t, r.id, "tier", r.stash === "none" ? 5 : tierOf(r.slots));
  });
  db.pouches.forEach(function (p) {
    if (hasSection(t, p.id)) t = setKey(t, p.id, "tier", p.tier);
  });
  /* AND ANYTHING ADOPTED THAT WAS TOLD TO TURN UP HERE. Written with
     the override marker: this is Grokitach's file, the section is
     somebody else's item, and a plain second declaration of one is
     fatal at startup. The three magazine-mod pouches above are already
     written that way in the shipped file. */
  adopted(db).forEach(function (x) {
    if (!owns(x, "drops")) return;
    var tier = x.slots ? tierOf(x.slots) : Math.max(1, Math.min(5, x.tier || 3));
    if (hasSection(t, x.id)) t = setKey(t, x.id, "tier", tier);
    else t = appendSection(t, "![" + x.id + "]" + NL + pad("tier", 32) + "= " + tier);
  });
  return t;
}
function lootPool(db, tpl) {
  var t = tpl;
  (db.removed || []).forEach(function (x) {
    t = t.replace(new RegExp("^" + esc(x.id) + "\\s*\r?\n", "m"), "");
  });
  var add = [];
  worldItems(db).forEach(function (x) {
    if (!new RegExp("^" + esc(x.id) + "\\s*$", "m").test(t)) add.push(x.id);
  });
  if (add.length) t = t.replace(/\s*$/, NL + add.join(NL) + NL);
  return t;
}

/* ------------------------------------------------------------
   7. mod_death_items_amp.ltx
   ------------------------------------------------------------ */
function deathItems(db, tpl) {
  var t = tpl;
  (db.removed || []).forEach(function (x) {
    t = t.replace(new RegExp("^" + esc(x.id) + "\\s*=\\s*true\\s*\r?\n", "m"), "");
  });
  var add = [];
  worldItems(db).forEach(function (x) {
    if (!new RegExp("^" + esc(x.id) + "\\s", "m").test(t)) add.push(pad(x.id, 24) + " = true");
  });
  if (add.length) t = t.replace(/\s*$/, NL + add.join(NL) + NL);
  return t;
}

/* ------------------------------------------------------------
   mod_system_amp_pouches.ltx - pouches of our own

   The three that ship are the magazine mod's sections and are not
   written here; anything else in db.pouches is ours, and this is where
   it is defined.

   THE SECTION IS BUILT, NOT CLONED. Every other new item copies a
   working neighbour, because a rig or a box section is forty lines of
   artefact template that would be mad to retype. There is no pouch of
   ours to copy from - the file ships empty, deliberately, because a
   template section with no picture would put a blank square in the
   spawn menu. So the template lives here, once, and it is the same
   forty lines with the rig keys swapped for pouch keys.
   ------------------------------------------------------------ */
var POUCH_TEMPLATE = [
  "[%ID%]:af_base",
  "$spawn\t\t\t\t                               = \"artefacts\\af_kevlar\"",
  "kind\t\t\t                               = i_attach",
  "class\t\t\t\t                               = II_ATTCH",
  "amp_pouch                                          = true",
  "amp_pgrant_2x2                                     = %G2X2%",
  "amp_pgrant_3x1                                     = %G3X1%",
  "amp_pgrant_2x1                                     = %G2X1%",
  "amp_pgrant_1x1                                     = %G1X1%",
  // WHICH SLIDER IT JOINS. Stamped the same way amp_rig_tier is on a
  // rig, and read by A.pouches_at: 1-2 small, 3 medium, 4-5 large.
  // A pouch without it is logged and never drops, rather than guessed
  // at and put on a rookie.
  "amp_pouch_tier                                     = %TIER%",
  "visual                                             = dynamics\\equipments\\aa\\kevlar",
  "description\t\t\t                               = st_%ID%_descr",
  "inv_name\t\t\t                               = st_%ID%_name",
  "inv_name_short\t\t\t                           = st_%ID%_name",
  "inv_weight\t\t\t                               = %WEIGHT%",
  "icons_texture\t\t\t\t\t\t\t\t\t   = ui\\ui_amp_pouches",
  "inv_grid_x\t\t\t                               = %GX%",
  "inv_grid_y\t\t\t                               = %GY%",
  "inv_grid_width\t\t\t                           = %GW%",
  "inv_grid_height\t\t\t                           = %GH%",
  "inv_grid_scale\t\t\t                           = 2",
  "cost\t\t\t\t                               = %COST%",
  "jump_height\t\t\t                               = 0.0",
  "det_show_particles\t\t                           = artefact\\af_thermal_show",
  "det_hide_particles\t\t                           = artefact\\af_thermal_hide",
  "particles_bone\t\t\t                           = joint2",
  "af_rank\t\t\t\t                               = 0",
  "lights_enabled                                     = false",
  "trail_light_color \t\t                           = 0.9,0.4,0.2",
  "trail_light_range \t\t                           = 2.0",
  "attach_angle_offset\t\t                           = 1.922,1.551,-0.740",
  "attach_position_offset                             = 0.15,0.002,0.25",
  "attach_bone_name\t\t                           = bip01_r_hand",
  "auto_attach\t\t\t                               = false",
  "health_restore_speed\t\t                       = 0",
  "radiation_restore_speed\t\t                       = 0",
  "satiety_restore_speed\t\t                       = 0",
  "bleeding_restore_speed\t\t                       = 0",
  "artefact_activation_seq\t\t                       = af_activation_bold",
  "power_restore_speed\t\t                           = -0.001",
  "use1_functor                                       = zzz_armor_mag_pouches.pouch_no_install",
  "use1_action_functor                                = zzz_armor_mag_pouches.pouch_no_install",
  "belt                                               = false"
].join(NL);

/* Pouches this mod DECLARES. An adopted one is somebody else's section
   with our keys added, so it is not written here and never gets a
   plain [section] of its own - that would be a fatal duplicate. */
function ourPouches(db) {
  return (db.pouches || []).filter(function (p) {
    return POUCHES.indexOf(p.id) < 0 && !p.adopt;
  });
}
function pouchSystem(db, tpl, sheet) {
  var t = tpl;
  (db.removed || []).forEach(function (x) {
    if (x.kind === "pouches") t = removeSection(t, x.id);
  });
  ourPouches(db).forEach(function (p) {
    var rect = (sheet && sheet[p.id]) || { x: 0, y: 0, w: 4, h: 4 };
    var g = p.grants || {};
    var body = POUCH_TEMPLATE
      .replace(/%ID%/g, p.id)
      .replace("%G2X2%", g["2x2"] || 0)
      .replace("%G3X1%", g["3x1"] || 0)
      .replace("%G2X1%", g["2x1"] || 0)
      .replace("%G1X1%", g["1x1"] || 0)
      .replace("%TIER%", Math.max(1, Math.min(5, p.tier || 3)))
      .replace("%WEIGHT%", fixw(p.weight))
      .replace("%COST%", Math.round(p.cost || 0))
      .replace("%GX%", rect.x)
      .replace("%GY%", rect.y)
      .replace("%GW%", rect.w || 4)
      .replace("%GH%", rect.h || 4);
    if (hasSection(t, p.id)) {
      // ALREADY THERE - retune it in place rather than writing a second
      // one. A section declared twice is a fatal error at startup.
      t = setKey(t, p.id, "amp_pgrant_2x2", g["2x2"] || 0);
      t = setKey(t, p.id, "amp_pgrant_3x1", g["3x1"] || 0);
      t = setKey(t, p.id, "amp_pgrant_2x1", g["2x1"] || 0);
      t = setKey(t, p.id, "amp_pgrant_1x1", g["1x1"] || 0);
      t = setKey(t, p.id, "amp_pouch_tier", Math.max(1, Math.min(5, p.tier || 3)));
      t = setKey(t, p.id, "inv_weight", fixw(p.weight));
      t = setKey(t, p.id, "cost", Math.round(p.cost || 0));
      t = setKey(t, p.id, "inv_grid_x", rect.x);
      t = setKey(t, p.id, "inv_grid_y", rect.y);
      // ...AND ITS SIZE, which can move now. A section left at
      // its old rectangle while the sheet was packed for a new
      // one shows a slice of whatever is drawn beside it.
      if (rect.w) t = setKey(t, p.id, "inv_grid_width", rect.w);
      if (rect.h) t = setKey(t, p.id, "inv_grid_height", rect.h);
    } else {
      t = appendSection(t, body);
    }
  });
  return t;
}

/* ------------------------------------------------------------
   mod_system_zzz_amp_adopted.ltx - somebody else's items

   An ADOPTED item is a section another mod already defines, given this
   mod's own keys and nothing else. Its name, price, weight and picture
   stay theirs; all we add is an opinion about what it does here.

   THE ! IS THE WHOLE THING. A second PLAIN declaration of a foreign
   section is a fatal error at startup - the game stops before the main
   menu. `![section]` adds to what is already there. So an adopted item
   never goes through pouchSystem or boxSystem, which write plain
   sections, and this emitter never writes anything but overrides.

   And the filename sorts last on purpose: mod_system_*.ltx are read in
   name order and an override has to come after what it overrides.
   ------------------------------------------------------------ */
/* HOW FAR AN ADOPTED ITEM IS TAKEN OVER.
   Nothing, by default: the keys that make it work here and not one
   field more. Each of these is a deliberate opt-in, because every one
   of them overrides something the other mod decided.

     name    its name and description become ours
     price   its price and weight become ours
     drops   it joins this mod's stash pool, corpse list and drop roll
     craft   it gets a recipe from this mod's workshop (rigs only)
     shelves it goes on the traders' shelves this mod writes  */
function owns(x, what) { return !!(x && x.adopt && x.own && x.own[what]); }
/* ...and the same question about an item of ours, which owns all of
   itself by definition. An emitter should ask THIS rather than test
   `adopt` directly, so the two cases read the same. */
function mayWrite(x, what) { return !x.adopt || owns(x, what); }

function adopted(db) {
  return (db.rigs || []).concat(db.pouches || []).concat(db.boxes || [])
    .filter(function (x) { return x.adopt; });
}
/* What each kind contributes. Only the keys the mod reads - anything
   else would be this mod deciding something that is not its business. */
function adoptKeys(x) {
  var out = [];
  // TAKEN OVER ONLY WHERE ASKED. These are the other mod's fields and
  // overriding one is a decision, not a default.
  if (owns(x, "name")) {
    out.push(["inv_name", "st_" + x.id + "_name"]);
    out.push(["inv_name_short", "st_" + x.id + "_name"]);
    out.push(["description", "st_" + x.id + "_descr"]);
  }
  if (owns(x, "price")) {
    out.push(["cost", Math.round(x.cost || 0)]);
    out.push(["inv_weight", fixw(x.weight)]);
  }
  /* ============================================================
     ...AND WHATEVER IT USED TO DO, CLOSED

       "the pouches from mags reloaded that our mod uses ... could be
        put on armours but we overwriten that function right. so we
        need to do that for adopted items too ... they work as our rig
        but also can be placed in pouch slots and that does not make
        sense"

     A rig or a pouch from another pack is built the way the magazine
     mod's pouches are: it INSTALLS onto the armour, and mag_pouches
     decides what is installable with exactly one test -

         ini_sys:r_string_ex(sec, "use1_functor") == "mag_pouches.precond_install"

     - so pointing that key at a precondition of ours closes both the
     right-click Install entry and the drag-onto-armour handler,
     without touching their script. It is what this mod already does to
     the three Mags Reloaded pouches (mod_system_zz_amp_pouches.ltx)
     and what every rig and container of ours carries.

     THIS USED TO BE THE ONE KEY ADOPT WOULD NOT WRITE, on the grounds
     that it would take away whatever their right-click does. That was
     the wrong call: leaving it open means two ways to wear the thing
     and only one of them grants any pockets, which is exactly the
     route this mod closed for the pouches in the first place.

         "the ZoneBench tool should make so the item works like a
          complete new item but just uses the same ID and texture"

     So it is written for every adopted item, always, and it is the
     line that makes that sentence true.
     ============================================================ */
  /* THE SAME TEST THE BRANCHES BELOW USE, in the same order. A rig is
     a rig even if something has put grants on it; asking a different
     question here would point a rig at the pouch door on the one item
     where the two disagree. */
  var shut = "zzz_armor_mag_pouches."
    + ((!x.slots && x.grants) ? "pouch_no_install" : "rig_no_install");
  out.push(["use1_functor", shut]);
  out.push(["use1_action_functor", shut]);

  if (x.slots) {
    // A RIG: the marker, the four pocket counts, the arrangement if it
    // has one, and the tier the drop ladder reads.
    out.push(["amp_rig", "true"]);
    KINDS.forEach(function (k) { out.push(["amp_slot_" + k, x.slots[k] || 0]); });
    if (x.pins && x.pins.length) out.push(["amp_layout", layoutStr(x)]);
    out.push(["amp_rig_tier", tierOf(x.slots)]);
    /* HOW IT IS MENDED, only where asked. Their rig already has a
       repair_type that some kit in their pack is built around, and
       changing it can mean nothing will mend the thing at all - so
       this one is a tick like the rest, not a default. */
    if (owns(x, "repair")) {
      /* ...AND THE BAR ON THE ICON, which is not the repair type.
         `use_condition` is what makes the engine keep the number and
         draw it on the cell, and their section need not have it - so
         an adopted rig showed a bar in the rig slot, where this mod
         draws it, and none in the bag, where the engine does. */
      out.push(["use_condition", "true"]);
      out.push(["repair_type", x.repair || "outfit_light"]);
      out.push(["repair_part_bonus",
        (Math.round((x.repairBonus == null ? bonusFor(x.slots)
                                           : Number(x.repairBonus)) * 1000) / 1000).toString()]);
    }
  } else if (x.grants) {
    var g = x.grants;
    out.push(["amp_pouch", "true"]);
    KINDS.forEach(function (k) { out.push(["amp_pgrant_" + k, g[k] || 0]); });
    out.push(["amp_pouch_tier", Math.max(1, Math.min(5, x.tier || 3))]);
  } else {
    out.push(["amp_box", "true"]);
    out.push(["amp_box_takes", x.takes || "any"]);
    out.push(["amp_box_snd", x.snd || "chest"]);
    out.push(["amp_box_w", x.inw || 1]);
    out.push(["amp_box_h", x.inh || 1]);
    var sline = slotLine(x);
    if (sline && slotsAreCells(x)) out.push(["amp_box_cells", "true"]);
    else if (sline) out.push(["amp_box_slots", sline]);
    // ...AND ON AN ADOPTED ONE TOO, for the same reason: leaving the
    // key out is the mod's default ten, not "no limit".
    if (x.kg != null) out.push(["amp_box_kg", fixw(x.kg)]);
    else out.push(["amp_box_noweight", "true"]);
    out.push(["amp_box_stack", x.stack || 1]);
  }
  return out;
}
function adoptedSystem(db, tpl) {
  var head = tpl.slice(0, tpl.search(/^!\[/m) < 0 ? tpl.length : tpl.search(/^!\[/m));
  var body = [];
  adopted(db).forEach(function (x) {
    body.push("![" + x.id + "]");
    adoptKeys(x).forEach(function (kv) {
      body.push(pad(kv[0], 51) + "= " + kv[1]);
    });
    body.push("");
  });
  if (!body.length) return head.replace(/\s*$/, NL);
  return head.replace(/\s*$/, NL + NL) + lines(body).replace(/\s*$/, NL);
}

/* ------------------------------------------------------------
   items/amp_boxes.ltx - WHAT EACH KIND OF CONTAINER TAKES

     "add option for boxes. to 'it takes' to also add new
      categories/add items by their IDs to make very specific boxes."

   None of this needed a change to the mod. `amp_box_takes = meds` names
   the section [amp_box_meds] in this file, and that section has always
   been able to say:

       kinds = i_medical, i_drink      what kinds of item
       also  = bandage, medkit         these sections, whatever kind
       never = medkit_army             and never these
       ammo / mags / guns / rigs       four families it cannot ask by kind
       no    = ...                     what it says when it refuses

   So a "very specific box" is a family whose `also` line names the six
   sections it takes and whose `kinds` line is empty. What was missing
   was any way to write one without opening the file.

   A FAMILY IS SHARED. Two containers with the same `amp_box_takes` are
   two containers with one rule, and editing it moves both. The page
   says so; this only writes what it is told.

   [amp_box_medpocket] is in this file and is NOT a box - it is the med
   pocket on a rig, asked the same question. It is left alone unless the
   bench is explicitly holding it.
   ------------------------------------------------------------ */
var FAM_KEYS = ["ammo", "mags", "guns", "rigs"];

function famList(v) {
  return (v == null ? [] : String(v).split(","))
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s !== ""; });
}
/* One family's block, in the file's own shape: the flags it has set,
   then the three lists, then the message. Only the flags that are TRUE
   are written, because that is how the shipped families read - a file
   full of `guns = false` says nothing and hides what does. */
function famBlock(name, f) {
  // AN EMPTY LIST IS `kinds =`, NOT `kinds = `. The shipped file has no
  // trailing space on any of its empty keys, and a build that added one
  // would show up in a diff as a change to a line nobody changed.
  var line = function (k, v) { return pad(k, 6) + "=" + (v ? " " + v : ""); };
  var out = ["[amp_box_" + name + "]"];
  FAM_KEYS.forEach(function (k) {
    if (f[k]) out.push(line(k, "true"));
  });
  out.push(line("kinds", famList(f.kinds).join(", ")));
  out.push(line("also", famList(f.also).join(", ")));
  out.push(line("never", famList(f.never).join(", ")));
  out.push(line("no", f.no || "That does not go in this box"));
  return out.join(NL);
}

function boxRules(db, tpl) {
  var t = tpl, fams = db.families || {};
  Object.keys(fams).forEach(function (name) {
    var f = fams[name], sec = "amp_box_" + name;
    if (!hasSection(t, sec)) {
      t = appendSection(t, famBlock(name, f));
      return;
    }
    /* IN PLACE, KEY BY KEY. Every one of these sections carries a
       paragraph explaining why it is the shape it is - which mod adds
       the kind, which item was refused and had to be named - and
       rewriting the block would throw all of it away to change one
       list. */
    FAM_KEYS.forEach(function (k) {
      if (f[k]) {
        if (hasKey(t, sec, k)) t = setKey(t, sec, k, "true");
        else t = addKeyBefore(t, sec, "kinds", k, "true");
      } else if (hasKey(t, sec, k)) {
        t = dropKey(t, sec, k);
      }
    });
    ["kinds", "also", "never"].forEach(function (k) {
      var v = famList(f[k]).join(", ");
      if (hasKey(t, sec, k)) t = setKeyAllowingBlank(t, sec, k, v);
      else if (v) t = addKeyBefore(t, sec, "no", k, v);
    });
    if (f.no != null && hasKey(t, sec, "no")) t = setKey(t, sec, "no", f.no);
  });
  return t;
}
/* setKey refuses to write an empty value, because everywhere else an
   empty one means "leave it". Here a list really can go empty - a
   family that took two kinds and now takes none by kind - so this is
   the one place that says so. */
function setKeyAllowingBlank(text, section, key, value) {
  // `[^\S\r\n]*` and not `\s*` for the pad. Nothing in this file makes
  // `\s*` misbehave here - it is followed by a required `=` - but `\s`
  // swallowing a line break has been the bug in this project three
  // times, and there is no reason to leave a fourth one lying about.
  var re = new RegExp("(^!?\\[" + esc(section) + "\\][^\\[]*?^)(" + esc(key) +
                      "([^\\S\\r\\n]*))=([^\r\n]*)", "m");
  return text.replace(re, function (all, head, k, sp, old) {
    if (old.trim() === String(value).trim()) return all;
    // An empty list is `kinds =`, not `kinds = ` - see famBlock.
    return head + k + "=" + (String(value) ? " " + value : "");
  });
}
function addKeyBefore(text, section, beforeKey, key, value) {
  var re = new RegExp("(^!?\\[" + esc(section) + "\\][^\\[]*?^)(" + esc(beforeKey) +
                      "([^\\S\\r\\n]*)=)", "m");
  if (!re.test(text)) return text;
  return text.replace(re, function (all, head, tail, sp) {
    return head + pad(key, beforeKey.length + sp.length) + "= " + value + NL + tail;
  });
}

/* Every family the file already describes, so the bench starts from
   what is there rather than from a list typed twice. */
function readFamilies(tpl) {
  var out = {}, re = /^\[amp_box_(\w+)\]([\s\S]*?)(?=^\[|(?![\s\S]))/gm, m;
  while ((m = re.exec(tpl))) {
    var body = m[2].split(/\r?\n/).map(function (l) { return l.split(";")[0]; }).join("\n");
    /* [^\S\r\n]* IS SPACES AND TABS. `\s*` includes the newline, so on
       an empty line - `also  =` with nothing after it - it swallowed the
       break and captured the NEXT line instead. That read the armour
       family's `also` as "never =" and its `never` as the refusal
       message. Third time this exact greedy-whitespace bug has turned
       up in this project. */
    var get = function (k) {
      var g = body.match(new RegExp("^" + k + "[^\\S\\r\\n]*=[^\\S\\r\\n]*(.*)$", "m"));
      return g ? g[1].trim() : "";
    };
    var f = { kinds: famList(get("kinds")), also: famList(get("also")),
              never: famList(get("never")), no: get("no") };
    FAM_KEYS.forEach(function (k) { f[k] = /^true$/i.test(get(k)); });
    out[m[1]] = f;
  }
  return out;
}

/* ------------------------------------------------------------
   7a. ITEMS GIVEN A NEW LOOK, AND NEW ITEMS

     "this would be able to jsut change visual/grid size/crafting/etc
      besides what the Item does, so in hunting kit case i would be able
      to change it to not look like a backpack and fit this into
      inventory balance as a small tool that will sit in the inventory.
      Editing should kinda work like adapt but without overwriting what
      Item is and how it function."

   So: adopt, minus the part that makes a thing ours. An adopted rig
   BECOMES this mod's rig - it gets our keys, our install route, our
   refusal to go in a pouch slot. An edited item is still exactly what
   it was; it has a different picture, takes a different amount of room,
   and costs something different to build.

   WHAT THIS WILL NEVER WRITE, and the list is the whole design: class,
   slot, any functor, ammo, damage, what it heals, what it is for.
   Those belong to whoever wrote the item.

   TWO SHAPES OF BLOCK. `![sec]` adds to an item that exists; a new item
   is `[amp_whatever]:parent`, inheriting from a real one so the game
   knows what to do with it before we change anything.
   ------------------------------------------------------------ */
/* The keys this is allowed to write, and nothing else is even reachable
   from the page. Grouped by the tick that turns each group on. */
var ITEM_GROUPS = {
  look:  ["icons_texture", "inv_grid_width", "inv_grid_height",
          "inv_grid_x", "inv_grid_y"],
  name:  ["inv_name", "inv_name_short", "description"],
  /* ONLY A BACKPACK REACHES THESE. An ordinary item being edited is
     having its LOOK changed and nothing else:

       "Item editor should not have 'new Item' we adopting existing
        Items and changing their look not properites so only options
        for Icon edit and name."

     A backpack is a different case - a new one is an item of ours from
     nothing, so it needs a price and a recipe like any other thing this
     mod makes. */
  price: ["cost", "inv_weight"]
};

function editedItems(db) {
  return (db.items || []).filter(function (x) { return x && x.id; });
}
/* Every item the bench writes a section for - the Item editor's list
   and the backpacks that are ours, which are items like any other. */
function itemSections(db) {
  return editedItems(db).concat(packItems(db));
}
/* The backpacks the bench holds, whatever shape the save is in - see
   packsFile for why there are two. */
function packItems(db) {
  var p = db && db.packs;
  return (p && p.length != null) ? p.filter(function (x) { return x && x.id; }) : [];
}
/* A NEW ITEM OWNS EVERYTHING, because there is no original to leave
   alone. The ticks exist to say which of somebody else's fields this
   mod overwrites; a thing made here has no somebody else. */
function itemOwns(x, what) {
  if (x && x.newItem) return true;
  return !!(x && x.own && x.own[what]);
}

function itemKeys(x, rect) {
  var out = [];
  /* A NEW ITEM SAYS WHAT IT IS MADE OF FIRST. The parent is not a
     cosmetic key - it is the whole reason the game knows what to do
     with a section nobody has ever seen. */
  if (itemOwns(x, "look")) {
    if (rect) {
      out.push(["icons_texture", "ui\\" + (x.sheet || "ui_amp_items")]);
      out.push(["inv_grid_x", String(rect.x)]);
      out.push(["inv_grid_y", String(rect.y)]);
      out.push(["inv_grid_width", String(rect.w)]);
      out.push(["inv_grid_height", String(rect.h)]);
    } else {
      /* NO PICTURE YET, BUT A SIZE. The room it takes in the bag is
         worth writing on its own - it is the half of "look" that is
         about balance rather than art - and writing a texture we have
         not drawn would be a blank square. */
      out.push(["inv_grid_width", String(x.cellw || 1)]);
      out.push(["inv_grid_height", String(x.cellh || 1)]);
    }
  }
  /* THE NAME IS A STRING ID, not the name. Writing the name itself
     would put English in a config file; this points the item at a
     string of ours, and textFile writes that string into all four
     language files. */
  if (itemOwns(x, "name")) {
    out.push(["inv_name", "st_" + x.id + "_name"]);
    out.push(["inv_name_short", "st_" + x.id + "_name"]);
    if (x.descr != null && String(x.descr).trim())
      out.push(["description", "st_" + x.id + "_descr"]);
  }
  if (itemOwns(x, "price")) {
    out.push(["cost", String(Math.max(0, Math.round(+x.cost || 0)))]);
    out.push(["inv_weight", fixw(+x.weight || 0)]);
  }
  return out;
}

function itemSystem(db, tpl, rects) {
  rects = rects || {};
  var head = tpl.slice(0, tpl.search(/^!?\[/m) < 0 ? tpl.length : tpl.search(/^!?\[/m));
  var body = [];
  itemSections(db).forEach(function (x) {
    var kv = itemKeys(x, rects[x.id]);
    /* A NEW ITEM IS WRITTEN EVEN WITH NOTHING TICKED, because without
       its block there is no item at all. An EXISTING one with nothing
       ticked is an item we have no opinion about, and writing it an
       empty override block would be a change to somebody's install for
       no reason. */
    if (!x.newItem && !kv.length) return;
    body.push(x.newItem
      ? "[" + x.id + "]:" + (x.parent || "itm_backpack")
      : "![" + x.id + "]");
    kv.forEach(function (p) { body.push(pad(p[0], 24) + "= " + p[1]); });
    body.push("");
  });
  if (!body.length) return head.replace(/\s*$/, NL);
  return head.replace(/\s*$/, NL + NL) + lines(body).replace(/\s*$/, NL);
}

/* ...AND WHAT THEY COST TO BUILD.

   The workshop is six numbered lists and a recipe has to be in the
   right one, so the category travels with the recipe. `![2]` adds to
   Craft and Repair Overhaul's list; a plain `[2]` would replace it and
   take every recipe in the game with it. */
var ITEM_CATS = [1, 2, 3, 4, 5, 6];

function itemCraftLine(x) {
  var c = x.craft;
  return "x_" + pad(x.id, 24) + " = " + c.kit + ", " + c.book + ","
    + c.parts.filter(function (r) { return r && r[0] && +r[1] > 0; })
        .map(function (r) { return r[0] + "," + r[1]; }).join(",");
}

function itemCraft(db, tpl) {
  var head = tpl.slice(0, tpl.search(/^!?\[/m) < 0 ? tpl.length : tpl.search(/^!?\[/m));
  var by = {};
  itemSections(db).forEach(function (x) {
    if (!itemOwns(x, "craft")) return;
    if (!(x.craft && x.craft.parts && x.craft.parts.length)) return;
    var cat = ITEM_CATS.indexOf(+x.craft.cat) >= 0 ? +x.craft.cat : 2;
    (by[cat] = by[cat] || []).push(itemCraftLine(x));
  });
  var body = [];
  ITEM_CATS.forEach(function (cat) {
    if (!by[cat]) return;
    body.push("![" + cat + "]");
    by[cat].forEach(function (l) { body.push(l); });
    body.push("");
  });
  if (!body.length) return head.replace(/\s*$/, NL);
  return head.replace(/\s*$/, NL + NL) + lines(body).replace(/\s*$/, NL);
}

/* ------------------------------------------------------------
   7b. how much room each backpack gives

   THE FIRST FILE OF ZONE GRID'S OWN THE BENCH HAS EVER TOUCHED. The
   two mods ship in one gamedata folder and always have, so this is a
   path like any other; it is only new in that nothing in here used to
   have a reason to read it.

   It is an OVERRIDES file. A pack that is named nowhere in it is
   worked out from its own carry bonus, which is why GAMMA's backpacks
   and every modded one already have sensible sizes without a list. So
   the bench writes lines for the packs somebody has an opinion about
   and leaves the rest alone - and "leave it alone" has to be a thing
   the page can say, or the first build would pin all of them.

   A SIZE IS EITHER A SHAPE OR A COUNT. `12x7` is twelve squares tall
   and seven across - tall first, the way a rig pocket's 2x1 has always
   read - and a plain number is a count laid out at the file's own
   width. Both are written back exactly as the page holds them.
   ------------------------------------------------------------ */
/* THE DEFAULT IS A SIZE LIKE ANY PACK'S, so there is one control to
   draw rather than a block of dials. The carry-bonus arithmetic that
   used to live beside it is gone:

     "Weight have nothing to say for the ammount of squares ... Weight
      is a seperate limiter for how much you can carry."   */
var PACK_SCALE_KEYS = ["size"];
var PACK_DEFAULT_SCALE = { size: "10x7" };

/* TALL x WIDE, or a count. Returns null for anything else, which is
   what the file's own reader does with it - so the page and the game
   disagree about nothing. */
function packSize(v) {
  if (v == null) return null;
  var s = String(v).trim();
  if (s === "") return null;
  var m = s.match(/^(\d+)\s*[xX]\s*(\d+)$/);
  if (m) {
    var h = +m[1], w = +m[2];
    if (h > 0 && w > 0) return { cells: h * w, cols: w, h: h, w: w, text: h + "x" + w };
  }
  if (/^\d+$/.test(s) && +s > 0) return { cells: +s, cols: null, text: s };
  return null;
}

/* One block of `name = value` lines, read with comments stripped. */
function packBlockOf(text, name) {
  var m = text.match(new RegExp("^\\[" + esc(name) +
    "\\][^\\S\\r\\n]*\\r?\\n([\\s\\S]*?)(?=^\\[|(?![\\s\\S]))", "m"));
  var out = {};
  if (!m) return out;
  m[1].split(/\r?\n/).forEach(function (line) {
    // `; i_backpack = 70` IS AN EXAMPLE, NOT AN ENTRY. The kind block
    // ships with exactly that in it, and a reader that took it would
    // have every backpack in the game answering 70 on a fresh install.
    var code = line.split(";")[0];
    // [^\S\r\n]* and not \s* - see setKeyAllowingBlank.
    var k = code.match(/^([\w.]+)[^\S\r\n]*=[^\S\r\n]*(.*)$/);
    if (k && k[2].trim() !== "") out[k[1]] = k[2].trim();
  });
  return out;
}

function readPacks(tpl) {
  var out = { scale: {}, sec: {}, kind: {} };
  PACK_SCALE_KEYS.forEach(function (k) { out.scale[k] = PACK_DEFAULT_SCALE[k]; });
  var sc = packBlockOf(tpl || "", "grid_pack_default");
  /* A FILE FROM THE VERSION IN BETWEEN wrote the default as `cells` and
     `cols` in a block called [grid_pack_scale]. Read it, so somebody
     who ran that build for an afternoon does not silently lose it. */
  if (!sc.size) {
    var old = packBlockOf(tpl || "", "grid_pack_scale");
    if (old.cells) sc.size = old.cols ? (Math.max(1,
      Math.ceil(+old.cells / +old.cols)) + "x" + old.cols) : old.cells;
  }
  if (sc.size && packSize(sc.size)) out.scale.size = String(sc.size).trim();
  out.sec = packBlockOf(tpl || "", "grid_pack_section");
  out.kind = packBlockOf(tpl || "", "grid_pack_kind");
  return out;
}

/* Rewrite one block's ENTRIES and nothing else.

   Line by line rather than block by block, because these blocks carry
   the commented example the file explains itself with - and because a
   line whose value has not changed must come back with its own padding
   untouched, or an unchanged build is a diff.

   THE TRAILING NEWLINES BELONG TO THE GAP BETWEEN BLOCKS, not to the
   block. Taking them in and putting them back is what stops an added
   entry growing the file by a blank line that removing it again does
   not take back - which has happened here once already. */
function writePackBlock(text, name, want) {
  var re = new RegExp("(^\\[" + esc(name) + "\\][^\\S\\r\\n]*\\r?\\n)" +
                      "([\\s\\S]*?)(?=^\\[|(?![\\s\\S]))", "m");
  var m = text.match(re);
  if (!m) return text;

  var head = m[1], body = m[2];
  var tail = (body.match(/(?:\r?\n)*$/) || [""])[0];
  var rows = body.slice(0, body.length - tail.length);
  rows = rows === "" ? [] : rows.split(/\r?\n/);

  var wide = 1;
  rows.forEach(function (line) {
    var k = line.split(";")[0].match(/^([\w.]+)[^\S\r\n]*=/);
    if (k && k[1].length + 1 > wide) wide = k[1].length + 1;
  });
  Object.keys(want).forEach(function (id) {
    if (id.length + 1 > wide) wide = id.length + 1;
  });

  /* THE FILE'S OWN LINE ENDINGS, not this emitter's. Everything the
     mod ships is CRLF and NL is that - but a file somebody has opened
     in the wrong editor is not, and a rebuilt block in the other kind
     would make every unchanged build a whole-file diff. */
  var nl = /\r\n/.test(body) || /\r\n/.test(head) ? "\r\n" : NL;

  var seen = {}, out = [];
  rows.forEach(function (line) {
    var k = line.split(";")[0].match(/^([\w.]+)([^\S\r\n]*)=([^\r\n]*)$/);
    if (!k) { out.push(line); return; }          // a comment, or blank
    var id = k[1];
    seen[id] = true;
    if (want[id] == null) return;                // taken away
    if (String(k[3]).trim() === String(want[id])) { out.push(line); return; }
    out.push(k[1] + k[2] + "= " + want[id]);
  });
  Object.keys(want).forEach(function (id) {
    if (!seen[id]) out.push(pad(id, wide) + "= " + want[id]);
  });

  return text.slice(0, m.index) + head + out.join(nl) + tail
       + text.slice(m.index + m[0].length);
}

/* THE FILE'S THREE BLOCKS, out of whatever the bench is holding.

   TWO SHAPES, because the page changed under it. It began as the file's
   own three blocks - a default, a by-kind list and a by-section list -
   and a backpack is now an ITEM with a page of its own, so the bench
   holds a list of packs instead. A save written by either is still a
   save, so both are read; only the list is written. */
function packsFile(db) {
  var p = db && db.packs;
  if (!p) return null;
  if (p.length == null) return p;               // the old object form
  var out = { scale: {}, sec: {}, kind: {} };
  if (db.packDefault) out.scale.size = db.packDefault;
  Object.keys(db.packKinds || {}).forEach(function (k) {
    out.kind[k] = db.packKinds[k];
  });
  p.forEach(function (x) {
    /* A PACK WITH NO OPINION ABOUT ITS SIZE IS NOT A LINE. Its page can
       be open for its picture or its price alone, and writing a size
       then would pin it to the default forever. */
    if (!x.id || !x.size) return;
    if (x.adopt && !itemOwns(x, "size")) return;
    out.sec[x.id] = x.size;
  });
  return out;
}

function packs(db, tpl) {
  /* WHAT THE FILE ALREADY SAYS IS THE FALLBACK, NOT THE SHIPPED
     DEFAULTS. A save written before this page existed carries no packs
     at all, and one written by a half-built page could carry a block
     of it; either way the answer for a thing nobody has an opinion
     about is the line that is already in the file. Falling back to the
     constants instead would quietly overwrite a hand-tuned number with
     the number it happened to ship as - which is exactly how sixteen
     parts lines were lost the first time a file joined this build. */
  var have = readPacks(tpl);
  var p = packsFile(db) || have;
  var t = tpl;

  var scale = {};
  PACK_SCALE_KEYS.forEach(function (k) {
    var v = (p.scale && p.scale[k] != null) ? p.scale[k] : have.scale[k];
    scale[k] = String(v);
  });
  t = writePackBlock(t, "grid_pack_default", scale);

  /* A SIZE THAT WILL NOT PARSE IS NOT WRITTEN. The page keeps whatever
     was typed so it can say what is wrong with it; the file gets only
     what the game can read, because a line it cannot read is a line it
     silently skips - and a pack that silently falls back to the
     arithmetic looks exactly like the bench not having run. */
  var clean = function (from) {
    var o = {};
    Object.keys(from || {}).forEach(function (id) {
      var s = packSize(from[id]);
      if (s) o[id] = s.text;
    });
    return o;
  };
  t = writePackBlock(t, "grid_pack_kind", clean(p.kind || have.kind));
  t = writePackBlock(t, "grid_pack_section", clean(p.sec || have.sec));
  return t;
}

/* ------------------------------------------------------------
   8. the four text files

   Only the name and the blurb, and only inside the string the id
   names. The rest of each file - and there is a lot of it - is other
   people's business.

   WHAT IS ALREADY TRANSLATED IS NOT OVERWRITTEN. The bench edits the
   English. Three of the four files carry that same English for the rig
   strings - they were never translated - but the Russian one is real
   Russian, done properly, and writing the bench's English over it
   would undo that silently and look like the emitter working. So a
   string is replaced only where the file still holds the English the
   bench started from; anywhere else it is left alone and named in
   `stale`.

   ...AND A STRING THAT IS NOT THERE IS ADDED. This is not a nicety: a
   new rig used to reach every config file correctly and arrive in game
   called `st_amprig_whatever_name`, because setString could only
   REPLACE. The item worked, spawned, held magazines and had no name -
   which reads as a broken mod rather than as a missing string.

   `base` is the untouched English, per string id.
   ------------------------------------------------------------ */
function textFile(db, tpl, base, stale) {
  var t = tpl;
  /* ...AND THE ITEM EDITOR'S, which name themselves the same way. An
     item whose name was not taken over keeps the one its own mod gave
     it and gets no string at all. */
  var named = itemSections(db).filter(function (x) {
    return x.newItem || itemOwns(x, "name");
  }).map(function (x) {
    return { id: x.id, name: x.name, descr: x.descr };
  });
  db.rigs.concat(db.boxes).concat(db.pouches || []).concat(named)
    .forEach(function (x) {
    // AN ADOPTED ITEM KEEPS ITS OWN NAME. It has one already, in the
    // mod that defines it, and writing a second would be this mod
    // renaming somebody else's item.
    if (x.borrowed) return;
    if (x.adopt && !owns(x, "name")) return;
    if (x.grants && !ourPouch(x) && !x.adopt) return;   // the magazine mod's three
    t = one(t, "st_" + x.id + "_name", x.name, x);
    if (x.descr != null) t = one(t, "st_" + x.id + "_descr", x.descr, x);
  });
  return t;
  function one(text, id, value, item) {
    var now = getString(text, id);
    if (now == null) return addString(text, id, value);
    var was = base ? base[id] : null;
    if (was != null && now !== was) {
      // translated. Leave it, and say so if the English moved.
      if (value !== was && stale && stale.indexOf(item.name) < 0) stale.push(item.name);
      return text;
    }
    return setString(text, id, value);
  }
}
/* A pouch of ours, as opposed to one of the magazine mod's - those
   three have their names in that mod's files and must not gain a
   second set here. */
function ourPouch(p) { return !!p && !!p.grants && POUCHES.indexOf(p.id) < 0; }

function getString(text, id) {
  var m = text.match(new RegExp("<string id=\"" + esc(id) +
    "\">\\s*<text>([\\s\\S]*?)</text>"));
  return m ? m[1] : null;
}
function setString(text, id, value) {
  var re = new RegExp("(<string id=\"" + esc(id) + "\">\\s*<text>)([\\s\\S]*?)(</text>)");
  if (!re.test(text)) return text;
  return text.replace(re, function (all, a, old, b) { return a + xml(value) + b; });
}
/* Added just before the closing tag, in the file's own shape - a tab,
   the string, two tabs and the text - so a hand-written file and a
   bench-written one read the same. */
function addString(text, id, value) {
  var block = "\t<string id=\"" + id + "\">" + NL
            + "\t\t<text>" + xml(value) + "</text>" + NL
            + "\t</string>" + NL;
  var close = text.lastIndexOf("</string_table>");
  if (close < 0) return text.replace(/\s*$/, NL) + block;
  return text.slice(0, close) + block + text.slice(close);
}
function xml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
/* The English the bench started from, read out of the file it shipped
   with, so nothing here has to be typed a second time. */
function baseStrings(engTpl) {
  var out = {}, re = /<string id="(st_\w+_(?:name|descr))">\s*<text>([\s\S]*?)<\/text>/g, m;
  while ((m = re.exec(engTpl))) out[m[1]] = m[2];
  return out;
}

/* ------------------------------------------------------------
   9. the two lists in the script

   Nothing in the game reads these - a rig is anything carrying
   mag_pouches' use1_functor, and its pockets are read by section name
   out of the balance file. The debug spawn menu and the load-time
   report read them, which is enough: a rig added everywhere else works
   in game and cannot be spawned to look at, which is the most annoying
   possible way for a new rig to be almost finished.

   Only what is between the braces is touched. The comments above each
   list explain why the order is the order, and they stay.
   ------------------------------------------------------------ */
/* ------------------------------------------------------------
   10. the trader shelves
   ------------------------------------------------------------ */
var SHELF_FILES = {
  general: ["trade_stalker_sidorovich", "trade_stalker_owl", "trade_stalker_loris",
    "trade_stalker_nimble", "trade_stalker_flea_market", "trade_stalker_flea_market_night",
    "trade_bandit", "trade_duty", "trade_freedom", "trade_freedom_ashot",
    "trade_military", "trade_military_esc", "trade_mercenary", "trade_mercenary_meeker",
    "trade_monolith", "trade_isg", "trade_isg_light", "trade_csky_spore",
    "trade_renegade", "trade_greh"],
  medic: ["trade_generic_medic"],
  ecolog: ["trade_ecolog_sakharov", "trade_ecolog_hermann"],
  mechanic: ["trade_generic_mechanic", "trade_isg_mission"],
  food: ["trade_generic_barman", "trade_stalker_butcher"]
};
/* Each shelf file is a handful of `section = count, chance` lines under
   somebody else's [supplies_N].

   SPLICED, LIKE EVERYTHING ELSE. Regenerating the body looked obvious
   and got two things wrong that nobody would have noticed until the
   diff: these are written rarest-first rather than in any order the
   bench knows, and they are padded to a width this file chose. So a
   line that is already there keeps its place and its spacing, and only
   its numbers move. */
function tradeFile(db, tpl, shelf) {
  var t = tpl;
  // the width the file itself uses, so an added line matches its neighbours
  var w = 22, m = tpl.match(/^(ampbox_\w+\s+)=\s/m);
  if (m) w = m[1].length;
  var want = {}, mine = {};
  /* ANYTHING THIS BUILD MAY PUT ON A SHELF - a container of ours, or
     an adopted item of any kind that was told to be sold. The old
     version walked only db.boxes and only matched ids beginning
     ampbox_, which is right until the mod can shelve something it did
     not name. */
  db.boxes.concat(db.rigs || []).concat(db.pouches || []).forEach(function (x) {
    if (x.borrowed) return;
    if (x.adopt && !owns(x, "shelves")) return;
    mine[x.id] = 1;
    var s = x.shelves && x.shelves[shelf];
    if (s) want[x.id] = s;
  });
  var drop = [];
  // every line already there: retune it, or mark it to go
  t = t.replace(/^(\w+)(\s+)=[^\r\n]*$/gm, function (all, id, sp) {
    // ...but only lines this build is responsible for. Everything else
    // on the shelf belongs to somebody else and is not ours to retune.
    if (!mine[id] && id.indexOf("ampbox_") !== 0) return all;
    var s = want[id];
    if (!s) { drop.push(id); return all; }
    delete want[id];
    return id + sp + "= " + s.count + ", " + chance(s.chance);
  });
  drop.forEach(function (id) {
    t = t.replace(new RegExp("^" + esc(id) + "\\s+=[^\\r\\n]*\\r?\\n", "m"), "");
  });
  // ...and anything newly put on this shelf
  var add = Object.keys(want).map(function (id) {
    return pad(id, Math.max(w, id.length + 1)) + "= " + want[id].count
      + ", " + chance(want[id].chance);
  });
  if (add.length) t = t.replace(/\s*$/, NL + add.join(NL) + NL);
  return t;
}
/* 0.4 rather than 0.40, and 1.0 rather than 1 - the way the file
   writes them. */
function chance(pc) {
  var v = (Number(pc) || 0) / 100;
  if (v >= 1) return "1.0";
  var s = v.toFixed(2);
  return s.charAt(s.length - 1) === "0" ? s.slice(0, -1) : s;
}

/* ------------------------------------------------------------
   configs/mod_sortingplus_amp.ltx - WHERE A NEW THING SORTS

   A rig's `kind` is i_attach, because to the magazine system that is
   genuinely what it is. Sorting Plus does not rank i_attach at all, so
   every rig fell off the end of the sort and sat with whatever else it
   could not place - and the fix was one line per rig in this file,
   telling Sorting Plus (and only Sorting Plus) to file it with the
   outfits. Boxes get the same treatment, with the backpacks.

   THE BENCH WAS NOT WRITING IT. Everything else a new container needs
   was being written - its section, its size, its price, its picture,
   its shelf - and then it sorted nowhere, because this one file was
   nobody's job. Found by the mod's own audit, on a container the
   browser test had just built: "a box has no Sorting Plus category".

   Nothing here is a choice: a rig sorts with the outfits and a box
   sorts with the storage, which is what all twenty-seven of the shipped
   ones do. So there is no setting for it, and no page.

   ADOPTED ITEMS ARE LEFT ALONE. Somebody else's item already has a
   category from the mod that defines it, and quietly moving it is not
   something this bench should decide on its own.
   ------------------------------------------------------------ */
var SORT_COL = 20;
function sortLine(id, cat) {
  var s = pad(id, SORT_COL);
  if (s === id) s += " ";        // a name longer than the column still spaces
  return s + "= " + cat;
}
function sorting(db, tpl) {
  var want = {}, order = [];
  ourRigs(db).forEach(function (r) {
    if (!r.adopt) { want[r.id] = "o_light"; order.push(r.id); }
  });
  (db.boxes || []).forEach(function (b) {
    if (!b.adopt && !b.borrowed) { want[b.id] = "i_backpack"; order.push(b.id); }
  });

  /* ONLY OUR OWN PREFIXES. The block of `amp_rig_*` names below the
     rigs is the pre-1.20.0 spelling, kept so a rig in an old save still
     sorts with the others - they are not sections that exist any more
     and nothing here should touch them. `amp_rig_` is not `amprig_`. */
  var re = /^(amprig_\w+|ampbox_\w+)[^\S\r\n]*=[^\S\r\n]*(\S*)[^\S\r\n]*$/;
  var src = tpl.split(NL), out = [], seen = {}, lastRig = -1, lastBox = -1;
  src.forEach(function (l) {
    var m = l.match(re);
    if (!m) { out.push(l); return; }
    var id = m[1];
    if (!want[id]) return;                 // gone from the bench, gone from here
    seen[id] = true;
    out.push(m[2] === want[id] ? l : sortLine(id, want[id]));
    if (id.indexOf("amprig_") === 0) lastRig = out.length - 1;
    else lastBox = out.length - 1;
  });

  var newRigs = [], newBoxes = [];
  order.forEach(function (id) {
    if (seen[id]) return;
    (want[id] === "o_light" ? newRigs : newBoxes).push(sortLine(id, want[id]));
  });
  /* BOXES FIRST. Splicing at the end of the box block is below the rig
     block, so the rig index is still the rig index afterwards. Doing it
     the other way round puts the new rigs one line too high, every
     time, and only when both are new. */
  if (newBoxes.length) {
    if (lastBox < 0) out = out.concat(newBoxes);
    else out.splice.apply(out, [lastBox + 1, 0].concat(newBoxes));
  }
  if (newRigs.length) {
    if (lastRig < 0) out = out.concat(newRigs);
    else out.splice.apply(out, [lastRig + 1, 0].concat(newRigs));
  }
  return out.join(NL);
}

/* ------------------------------------------------------------
   mod_craft_zzz_amp_magpouch.ltx - WHAT A POUCH COSTS TO BUILD

     "also add crafting editor to pouches and optional for adopted
      pouches"

   A rig's recipe is DERIVED and always has been: a rig costs what it
   would cost to reach that shape by bolting pouches onto a strap, and
   the bench does not offer to change it because the derivation is the
   balance. A pouch is the bottom of that ladder - there is nothing
   underneath it to be made of - so there is nothing to derive from,
   and the recipe is simply a recipe. Hence an editor rather than a
   formula.

   THE DEFAULT IS STILL WORKED OUT, from what the pouch grants, in the
   same vocabulary the rigs use: thread and cloth, in the tier its
   stash rank folds to. So a new pouch is craftable the moment it
   exists and every field can be changed afterwards.

   WHERE IT GOES. `![2]` is the workshop's own category and this file
   already declares it - the zzz_ in the name is load order, and the
   note in the file itself is worth reading before touching that.

   FOUR INGREDIENTS. ui_workshop parses each line into at most four and
   drops the whole recipe if there are more, without saying so.
   ------------------------------------------------------------ */
function pouchRecipe(p) {
  var cells = cellsOf(p.grants || {});
  var tier = FOLD[Math.max(1, Math.min(5, p.tier || 3))];
  return {
    kit: CRAFT_T[tier],
    book: BOOK[tier],
    parts: [["sewing_thread", THREAD_BASE[tier] + THREAD_PER * cells],
            [FABRIC[tier], BASE_FABRIC[tier] + 2 * cells]]
  };
}
/* What the bench holds for one pouch, filled in from the derivation the
   first time anybody looks. `parts` is a list of [section, count]. */
function pouchCraftOf(p) {
  var c = p.craft;
  if (!c || !c.parts || !c.parts.length) return pouchRecipe(p);
  return { kit: c.kit || pouchRecipe(p).kit,
           book: c.book || pouchRecipe(p).book,
           parts: c.parts.filter(function (x) {
             return x && x[0] && Number(x[1]) > 0;
           }) };
}
function pouchCraftLine(p) {
  var r = pouchCraftOf(p);
  var body = r.parts.map(function (x) {
    return x[0] + "," + Math.round(Number(x[1]));
  }).join(",");
  return "x_" + pad(p.id, 22) + " = " + r.kit + ", " + r.book + "," + body;
}
/* The same count ui_workshop does: kit, book and two fields per
   ingredient. Six, eight or ten; anything more is a recipe the
   workshop silently drops. */
function pouchCraftFields(p) {
  return pouchCraftLine(p).split("=")[1].trim().split(",").length;
}

/* Every pouch this build may write a recipe for: ours, and an adopted
   one that was explicitly told to have one. The magazine mod's three
   are not in it - their recipes are theirs, and the one line this file
   already carries about af_magpouch_m is a deliberate override that
   nothing here touches. */
function craftPouches(db) {
  var out = ourPouches(db).filter(function (p) { return !p.adopt; });
  (db.pouches || []).forEach(function (p) {
    if (p.adopt && owns(p, "craft")) out.push(p);
  });
  return out;
}
function pouchCraft(db, tpl) {
  var t = tpl;
  craftPouches(db).forEach(function (p) {
    if (!p.id) return;
    var re = new RegExp("^x_" + esc(p.id) + "[^\\S\\r\\n]*=[^\r\n]*", "m");
    if (re.test(t)) t = t.replace(re, pouchCraftLine(p));
    else t = t.replace(/\s*$/, NL + pouchCraftLine(p) + NL);
  });
  /* A POUCH THAT IS NO LONGER CRAFTABLE LOSES ITS LINE - removed from
     the bench, or an adopted one whose tick was turned off again. A
     recipe naming a section nothing declares is a workshop entry that
     builds nothing. */
  var live = {};
  craftPouches(db).forEach(function (p) { live[p.id] = true; });
  (db.pouches || []).forEach(function (p) {
    if (live[p.id] || !p.id) return;
    /* ...AND NEVER ONE OF THEIRS. The magazine mod's three are in this
       list too, and one of them - af_magpouch_m - is the whole reason
       this file exists: the override that moves the medium pouch off
       the advanced bench. Without this guard the first build after the
       editor shipped would have deleted it, silently, and put the
       medium pouch back behind twenty hours of progression. */
    if (POUCHES.indexOf(p.id) >= 0) return;
    t = t.replace(new RegExp("^x_" + esc(p.id) + "[^\\S\\r\\n]*=[^\r\n]*\r?\n", "m"), "");
  });
  (db.removed || []).forEach(function (x) {
    if (x.kind !== "pouches") return;
    t = t.replace(new RegExp("^x_" + esc(x.id) + "[^\\S\\r\\n]*=[^\r\n]*\r?\n", "m"), "");
  });
  return t;
}

/* ------------------------------------------------------------
   mod_parts_amp_rigs.ltx - WHAT A RIG IS MADE OF

     "the tool lacs the ability to change what Items are used as parts,
      to swap them out as that is also a way to repair the rigs"

   TWO LISTS IN ONE FILE, AND THEY ANSWER DIFFERENT QUESTIONS. This is
   the thing to get right before anything else here makes sense:

     nor_parts_list   what dismantling the rig GIVES BACK. Every entry
                      is created, one each - it is not a pool to roll
                      from, it IS the yield. item_parts' own
                      disassembly_item reads this and nothing else.

     con_parts_list   the components the WORKBENCH lets you replace.
                      ui_workshop's parts window tests exactly this key
                      and no other, which is why it is also what puts
                      the parts dots on a cell - and it is the second
                      way to mend a rig, by swapping a worn component
                      rather than by using a kit.

   THE SECOND ONE IS THE HALF THE REPORT IS ABOUT. An adopted rig had
   no line in it, so no dots and nothing to swap.

   THE RULES, FROM THE HEAD OF parts.ltx AND THE MOD'S OWN AUDIT:
   at most six components, every one DIFFERENT (a repeat is one slot
   written twice, not two components), and every one a conditional
   item - prt_o_*, never the prt_i_* hardware, which has no condition
   and would simply be ignored. The yield has no such rule: hardware is
   exactly what a rig should give back.

   AND NEVER A POUCH IN THE YIELD. Craft rig -> break rig -> keep
   pouches would be the cheapest pouch in the game. The Check page says
   so rather than the emitter refusing, because it is a balance
   decision and not a broken file.
   ------------------------------------------------------------ */
var PART_MAX = 6;

/* Every part section the reference install has, which is the same list
   the mod's audit checks against - a section that does not exist is
   skipped in silence by the dismantler, so the rig breaks down and one
   of the things it promised is simply not there. */
var KNOWN_PARTS = (function () {
  var out = ["prt_o_support_1", "prt_i_fasteners", "prt_i_plastic", "prt_i_scrap"];
  for (var i = 1; i <= 4; i++) out.push("prt_o_fabrics_" + i);
  for (var j = 1; j <= 20; j++) out.push("prt_o_retardant_" + j);
  for (var k = 1; k <= 20; k++) out.push("prt_o_ballistic_" + k);
  return out;
})();

/* WHAT A RIG THAT HAS NEVER BEEN TOLD IS MADE OF. Cloth by tier, the
   way the shipped ladder does it: two components at the bottom, three
   in the middle, four at the top, and a coated fabric once a rig is
   real kit rather than webbing. */
function partsDefault(slots) {
  var t = FOLD[tierOf(slots)] || 1;
  if (t <= 1) return ["prt_o_fabrics_1", "prt_o_fabrics_2"];
  if (t === 2) return ["prt_o_fabrics_2", "prt_o_fabrics_3", "prt_o_retardant_5"];
  return ["prt_o_fabrics_2", "prt_o_fabrics_3", "prt_o_fabrics_4", "prt_o_retardant_6"];
}
function yieldDefault(slots) {
  var t = FOLD[tierOf(slots)] || 1;
  if (t <= 1) return ["prt_o_fabrics_1", "prt_i_fasteners"];
  if (t === 2) return ["prt_o_fabrics_2", "prt_o_fabrics_1", "prt_i_fasteners",
                       "prt_i_plastic"];
  return ["prt_o_fabrics_3", "prt_o_fabrics_2", "prt_o_fabrics_1",
          "prt_i_fasteners", "prt_i_plastic"];
}
function partsOf(r) {
  var p = r.parts;
  if (!p || !p.length) return partsDefault(r.slots);
  return p.filter(function (x) { return x && String(x).trim(); });
}
function yieldOf(r) {
  var p = r["yield"];
  if (!p || !p.length) return yieldDefault(r.slots);
  return p.filter(function (x) { return x && String(x).trim(); });
}

/* One line in one of the two sections, spliced in place. The file is
   grouped by tier under its own comments and the lines are aligned by
   hand, so a rig that is already there keeps its place and its column
   and only its value moves. */
function partsLine(id, list, pad_to) {
  return pad(id, pad_to) + "= " + list.join(", ");
}
function partsWrite(t, section, id, list) {
  var body = new RegExp("(^!\\[" + esc(section) + "\\][\\s\\S]*?)(?=^!?\\[|(?![\\s\\S]))", "m");
  var m = t.match(body);
  if (!m) return t;

  var block = m[1];
  var line = new RegExp("^" + esc(id) + "([^\\S\\r\\n]*)=[^\r\n]*", "m");
  var hit = block.match(line);
  if (hit) {
    var want = pad(id, id.length + hit[1].length) + "= " + list.join(", ");
    if (hit[0] === want) return t;
    return t.replace(block, block.replace(line, want));
  }
  /* NEW, AT THE END OF THE SECTION. Not in a tier group: the groups
     are comments and a rig this file has never seen has no group to
     belong to, so it goes where it can be found rather than where it
     might have gone. */
  /* INSERTED BEFORE THE BLOCK'S OWN TRAILING BLANK LINES, not after.
     Adding a line and two newlines left one blank line behind when the
     rig was taken away again - the drop takes a line, not the shape of
     the file - so the section grew a blank every time somebody added a
     rig and removed it. The trailing whitespace is put back exactly as
     it was found. */
  var col = 18;
  var tail = (block.match(/\s*$/) || [""])[0];
  var added = block.replace(/\s*$/, NL + partsLine(id, list, col) + tail);
  return t.replace(block, added);
}
function partsDrop(t, section, id) {
  var body = new RegExp("(^!\\[" + esc(section) + "\\][\\s\\S]*?)(?=^!?\\[|(?![\\s\\S]))", "m");
  var m = t.match(body);
  if (!m) return t;
  var block = m[1];
  var cut = block.replace(new RegExp("^" + esc(id) + "[^\\S\\r\\n]*=[^\r\n]*\r?\n", "m"), "");
  return t.replace(block, cut);
}

/* Which rigs this build may write a parts line for: ours, and an
   adopted one whose repair has been taken over - that tick is what
   says "this rig is mended and stripped like one of ours". */
function partsRigs(db) {
  var out = ourRigs(db);
  (db.rigs || []).forEach(function (r) {
    if (r.adopt && owns(r, "repair")) out.push(r);
  });
  return out;
}
function parts(db, tpl) {
  var t = tpl;
  partsRigs(db).forEach(function (r) {
    if (!r.id) return;
    t = partsWrite(t, "con_parts_list", r.id, partsOf(r));
    t = partsWrite(t, "nor_parts_list", r.id, yieldOf(r));
  });
  // A rig this build no longer claims loses both lines. A parts entry
  // for a section nothing declares is a workbench slot with nothing
  // behind it.
  var live = {};
  partsRigs(db).forEach(function (r) { live[r.id] = true; });
  (db.rigs || []).forEach(function (r) {
    if (live[r.id] || !r.id) return;
    t = partsDrop(t, "con_parts_list", r.id);
    t = partsDrop(t, "nor_parts_list", r.id);
  });
  (db.removed || []).forEach(function (x) {
    if (x.kind !== "rigs") return;
    t = partsDrop(t, "con_parts_list", x.id);
    t = partsDrop(t, "nor_parts_list", x.id);
  });
  return t;
}

root.EMIT = {
  NL: NL, pad: pad, lines: lines,
  KINDS: KINDS, cellsOf: cellsOf, worthOf: worthOf, tierOf: tierOf, where: where,
  recipeOf: recipeOf, rigRecipe: rigRecipe,
  craftLine: craftLine, craftFields: craftFields,
  layoutStr: layoutStr,
  setKey: setKey, dropKey: dropKey, hasSection: hasSection, hasKey: hasKey,
  slotLine: slotLine, slotsAreCells: slotsAreCells,
  getSection: getSection, cloneSection: cloneSection, removeSection: removeSection,
  rigSystem: rigSystem, boxSystem: boxSystem, balance: balance, craft: craft,
  lootTier: lootTier, lootPool: lootPool, deathItems: deathItems,
  realPouch: realPouch, worldItems: worldItems,
  ourRigs: ourRigs, owns: owns, mayWrite: mayWrite,
  boxRules: boxRules, readFamilies: readFamilies, famList: famList,
  packs: packs, readPacks: readPacks, packSize: packSize,
  itemSystem: itemSystem, itemCraft: itemCraft, itemKeys: itemKeys,
  packsFile: packsFile, packItems: packItems,
  editedItems: editedItems, itemSections: itemSections, itemOwns: itemOwns,
  ITEM_GROUPS: ITEM_GROUPS, ITEM_CATS: ITEM_CATS,
  PACK_SCALE_KEYS: PACK_SCALE_KEYS, PACK_DEFAULT_SCALE: PACK_DEFAULT_SCALE,
  bonusFor: bonusFor, REPAIR_BONUS: REPAIR_BONUS,
  sorting: sorting,
  parts: parts, partsOf: partsOf, yieldOf: yieldOf,
  partsDefault: partsDefault, yieldDefault: yieldDefault,
  KNOWN_PARTS: KNOWN_PARTS, PART_MAX: PART_MAX,
  pouchCraft: pouchCraft, pouchRecipe: pouchRecipe,
  pouchCraftOf: pouchCraftOf, pouchCraftFields: pouchCraftFields,
  adopted: adopted, adoptKeys: adoptKeys, adoptedSystem: adoptedSystem,
  pouchSystem: pouchSystem, ourPouches: ourPouches, ourPouch: ourPouch,
  textFile: textFile, getString: getString, baseStrings: baseStrings,
  tradeFile: tradeFile, SHELF_FILES: SHELF_FILES,
  craftOrder: null, rigOrder: null
};
})(typeof globalThis !== "undefined" ? globalThis : this);

