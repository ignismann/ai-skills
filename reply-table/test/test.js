// Extracts the widget template from SKILL.md and exercises it in a simulated DOM.
// Run: npm test
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { JSDOM } = require("jsdom");

const skill = fs.readFileSync(path.join(__dirname, "..", "SKILL.md"), "utf8");
const m = skill.match(/```html\n([\s\S]*?)```/);
assert(m, "no ```html block found in SKILL.md");

const dom = new JSDOM("<body>" + m[1] + "</body>", {
  runScripts: "dangerously",
  beforeParse(w) { w.sent = []; w.sendPrompt = (msg) => w.sent.push(msg); },
});
const w = dom.window, d = w.document;
const rows = [...d.querySelectorAll(".rt-row")];
const btn = (i, label) => [...rows[i].querySelectorAll("button")].find((b) => b.dataset.v === label);
const click = (b) => b.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
const type = (i, v) => { const t = rows[i].querySelector("textarea"); t.value = v; t.dispatchEvent(new w.Event("input")); };
const send = [...d.querySelectorAll("button")].find((b) => b.textContent.startsWith("Send"));
const on = (b) => b.classList.contains("rt-on") && b.getAttribute("aria-pressed") === "true"
  && b.style.getPropertyPriority("background") === "important" && b.firstChild.style.display === "inline-block";
const off = (b) => !b.classList.contains("rt-on") && b.getAttribute("aria-pressed") === "false"
  && b.style.getPropertyValue("background") === "" && b.firstChild.style.display === "none";

let n = 0;
const ok = (name, fn) => { fn(); n++; console.log("ok -", name); };

ok("renders all template rows", () => assert.strictEqual(rows.length, 6));
ok("counter starts at zero", () => assert.match(d.querySelector(".rt-count").textContent, /^0 of 6/));
ok("empty send shows error and sends nothing", () => {
  click(send);
  assert.match(d.querySelector(".rt-err").textContent, /at least one/);
  assert.strictEqual(w.sent.length, 0);
});
ok("single select highlights one button only", () => {
  click(btn(0, "Option A")); assert(on(btn(0, "Option A")));
  click(btn(0, "Option B")); assert(on(btn(0, "Option B"))); assert(off(btn(0, "Option A")));
});
ok("multi select highlights several", () => {
  click(btn(1, "X")); click(btn(1, "Z"));
  assert(on(btn(1, "X"))); assert(on(btn(1, "Z"))); assert(off(btn(1, "Y")));
});
ok("clicking a selected button deselects it", () => {
  click(btn(4, "Accept")); assert(on(btn(4, "Accept")));
  click(btn(4, "Accept")); assert(off(btn(4, "Accept")));
});
ok("carried-over items are labelled", () => assert.match(rows[2].querySelector(".rt-type").textContent, /carried over/));
ok("default is shown", () => assert.match(rows[0].textContent, /If unanswered: Option A/));

type(2, "line one\nline two");
click(btn(3, "Modify")); type(3, "only for EU");
ok("counter and error update", () => {
  assert.match(d.querySelector(".rt-count").textContent, /^4 of 6/);
  assert.strictEqual(d.querySelector(".rt-err").textContent, "");
});
ok("message format", () => {
  click(send);
  assert.strictEqual(w.sent.length, 1);
  assert.strictEqual(w.sent[0], [
    "Review replies — Topic of this round:",
    "Q1: Option B",
    "Q2: X, Z",
    "Q3: line one / line two",
    "A1: Modify — only for EU",
    "Not answered: P1, S1",
  ].join("\n"));
});
ok("comment-only answer counts as answered", () => {
  type(5, "Disagree because ...");
  click(send);
  assert.match(w.sent[1], /S1: Disagree because/);
  assert.match(w.sent[1], /Not answered: P1$/);
});

console.log(`\n${n} checks passed`);
