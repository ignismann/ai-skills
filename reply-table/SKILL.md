---
name: reply-table
description: Use when the user or project instructions call for a reply table. Shows all questions and comment-worthy statements in an inline interactive table with input fields and a send button.
---

# Reply table

Puts everything in a response that needs the user's reaction into an interactive table shown inline in the chat: the item on the left, the input on the right, and a "Send replies" button that returns all answers as one message, each tagged by item ID.

## When to use

- Only when required: the user asks for it in the chat (e.g. "reply table", "table mode", "use the reply-table skill"), or project or custom instructions say to use it. Never switch it on by own judgment.
- Once required, apply it to every response in that chat or project that contains at least one table item (see below), until the user says to stop. Unanswered items carried over from an earlier table count too. A response with nothing to answer stays plain prose: no empty table.

## What goes into the table

Include:
- All questions to the user, without exception (clarifications, choices, requests for data or confirmation).
- Statements that, within the logic of the current chat, may require the user's comment:
  - assumptions made to fill gaps or to interpret ambiguous input;
  - proposals and recommendations the user has to accept or reject;
  - decisions or choices made on the user's behalf;
  - conclusions, findings or interpretations that later work builds on;
  - risks, open issues, or deviations from what the user asked for.
- Unanswered items of any type from earlier tables (see Handling the replies).

Leave out (they stay in the prose): plain facts, background explanations, restatements of the user's input, and the content of finished deliverables (files, drafts, code). If the user's approval of a deliverable matters for the next steps, add one statement item about it.

## Response layout

1. Prose first: the answer, explanation or result, i.e. everything that is not a table item. Do not repeat the table items in the prose.
2. One sentence leading into the table.
3. The table (show_widget).
4. Nothing after it, or at most one short line (e.g. which items block further work).

One table per response, at most 20 rows (carried-over items included). With more items, keep the blocking or most consequential ones and move the rest to the next round; say so in one line.

## Item types and inputs

| Type | ID prefix | Buttons | Free text |
|---|---|---|---|
| question | Q | the answer options if the answer is a choice (2-4 short labels; add `multi: true` for multi-select); none for open questions | always; for open questions it is the answer field |
| assumption | A | Confirm / Reject / Modify (preset) | always |
| proposal | P | Accept / Reject / Modify (preset) | always |
| statement | S | Agree / Disagree / Unclear (preset) | always |

- Number IDs per type within each table: Q1, Q2, A1, P1, S1, ...
- Write each item so it stands alone in one or two sentences: the user reads it only in the table.
- Give questions and assumptions a `default` (what will happen if the item stays unanswered) whenever a sensible one exists.
- An item carried over from an earlier table gets `carried: true` (shown as "carried over") and a new ID in the new table. Keep its wording unless the context has changed.
- A question item may override the preset buttons via `options`; any item may set a custom `placeholder` for its text field.

## Building the table

- Before the first table in a conversation, load the visualizer guidance (read_me with the interactive module), as the tool requires. Do not mention this step.
- Copy the template below verbatim into show_widget's widget_code. Change only TITLE, ITEMS and the sr-only summary line. Use `reply_table_<topic>` as the widget title.
- TITLE is a short topic name for this round (a few words). ITEMS is a JavaScript array: plain text only (no HTML or markdown), double quotes inside strings escaped as \".
- Selected buttons get a solid accent fill and a check mark, applied as inline styles so the host's button styles cannot hide the selection. Do not remove the `paint` function or the check icon.

```html
<style>
.rt-head,.rt-row{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:16px}
.rt-head{padding-bottom:8px;font-size:12px;color:var(--text-muted)}
.rt-row{padding:14px 0;border-top:0.5px solid var(--border)}
.rt-id{display:inline-block;font-size:12px;font-weight:500;padding:2px 8px;border-radius:var(--radius);margin-right:6px;background:var(--bg-neutral);color:var(--text-secondary)}
.rt-id.rt-q{background:var(--bg-accent);color:var(--text-accent)}
.rt-type,.rt-def{font-size:12px;color:var(--text-muted)}
.rt-text{font-size:14px;line-height:1.6;color:var(--text-primary);margin:6px 0 0}
.rt-def{margin:4px 0 0}
.rt-opts{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.rt-opts button{font-size:13px;padding:5px 10px;height:auto}
.rt-opts button.rt-on{background:var(--fill-accent,#2c84db)!important;color:var(--on-accent,#ffffff)!important;border-color:var(--fill-accent,#2c84db)!important}
.rt-ck{font-size:14px;margin-right:4px;vertical-align:-2px}
.rt-row textarea{width:100%;min-height:52px;font-size:13px;box-sizing:border-box}
.rt-foot{border-top:0.5px solid var(--border);padding-top:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.rt-count{font-size:13px;color:var(--text-secondary)}
.rt-err{font-size:13px;color:var(--text-danger)}
@media (max-width:560px){.rt-row{grid-template-columns:minmax(0,1fr)}.rt-head{display:none}}
</style>
<h2 class="sr-only">Reply table with questions and statements for your input, and a send button.</h2>
<div id="rt" style="padding:0.5rem 0 0"></div>
<script>
const TITLE="Topic of this round";
const ITEMS=[
{id:"Q1",type:"question",text:"Which option should I use?",options:["Option A","Option B"],default:"Option A"},
{id:"Q2",type:"question",text:"Which of these apply?",options:["X","Y","Z"],multi:true},
{id:"Q3",type:"question",text:"An open question carried over from the last table?",placeholder:"Your answer",carried:true},
{id:"A1",type:"assumption",text:"I assume that ...",default:"Treated as confirmed"},
{id:"P1",type:"proposal",text:"I propose to ..."},
{id:"S1",type:"statement",text:"Finding that later steps build on ..."}
];
const PRESETS={assumption:["Confirm","Reject","Modify"],proposal:["Accept","Reject","Modify"],statement:["Agree","Disagree","Unclear"]};
const LABELS={question:"Question",assumption:"Assumption",proposal:"Proposal",statement:"Statement"};
const root=document.getElementById("rt");
const el=(t,c,s)=>{const e=document.createElement(t);if(c)e.className=c;if(s!=null)e.textContent=s;return e};
const head=el("div","rt-head");head.append(el("span",null,"My questions and statements"),el("span",null,"Your input"));root.append(head);
const cnt=el("span","rt-count"),err=el("span","rt-err");
const paint=(b,on)=>{b.setAttribute("aria-pressed",on?"true":"false");b.classList.toggle("rt-on",on);b.firstChild.style.display=on?"inline-block":"none";const s=b.style;if(on){s.setProperty("background","var(--fill-accent,#2c84db)","important");s.setProperty("color","var(--on-accent,#ffffff)","important");s.setProperty("border-color","var(--fill-accent,#2c84db)","important")}else["background","color","border-color"].forEach(p=>s.removeProperty(p))};
const rows=ITEMS.map(it=>{
const r=el("div","rt-row"),L=el("div"),R=el("div");
L.append(el("span","rt-id"+(it.type==="question"?" rt-q":""),it.id),el("span","rt-type",(LABELS[it.type]||"Item")+(it.carried?" · carried over":"")),el("p","rt-text",it.text));
if(it.default)L.append(el("p","rt-def","If unanswered: "+it.default));
const opts=it.options||PRESETS[it.type]||[];let g=null;
if(opts.length){g=el("div","rt-opts");opts.forEach(o=>{const b=el("button");b.type="button";b.dataset.v=o;const ic=el("i","ti ti-check rt-ck");ic.setAttribute("aria-hidden","true");b.append(ic,document.createTextNode(o));paint(b,false);g.append(b)});
g.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const on=b.getAttribute("aria-pressed")==="true";if(!it.multi)g.querySelectorAll("button").forEach(x=>paint(x,false));paint(b,!on);update()});R.append(g)}
const ta=el("textarea");ta.placeholder=it.placeholder||(opts.length?"Comment (optional)":"Your answer");if(!opts.length)ta.style.minHeight="80px";ta.addEventListener("input",update);R.append(ta);
r.append(L,R);root.append(r);return{it,g,ta}});
const collect=()=>rows.map(x=>({id:x.it.id,sel:x.g?[...x.g.querySelectorAll('button[aria-pressed="true"]')].map(b=>b.dataset.v).join(", "):"",txt:x.ta.value.trim().replace(/\s*\n\s*/g," / ")}));
function update(){const n=collect().filter(a=>a.sel||a.txt).length;cnt.textContent=n+" of "+rows.length+" answered";if(n)err.textContent=""}
const foot=el("div","rt-foot"),right=el("div"),send=el("button",null,"Send replies ↗");send.type="button";
right.style.cssText="display:flex;align-items:center;gap:10px";right.append(err,send);foot.append(cnt,right);root.append(foot);
send.addEventListener("click",()=>{const a=collect(),done=a.filter(x=>x.sel||x.txt);if(!done.length){err.textContent="Answer at least one item first";return}
const open=a.filter(x=>!x.sel&&!x.txt).map(x=>x.id);
let msg="Review replies — "+TITLE+":\n"+done.map(x=>x.id+": "+[x.sel,x.txt].filter(Boolean).join(" — ")).join("\n");
if(open.length)msg+="\nNot answered: "+open.join(", ");sendPrompt(msg)});
update();
</script>
```

## Handling the replies

Replies arrive as one message, for example:

```
Review replies — Topic of this round:
Q1: Option B
Q2: X, Z
Q3: free text answer
A1: Modify — only for EU
Not answered: P1, S1
```

- Match each line to the item with that ID in the most recent table with that title.
- The free-text comment always prevails over the selected button. "Reject" or "Modify" without text: ask in the next table what should change.
- Unanswered items of any type (questions, assumptions, proposals, statements), blocking or not, go into the next table again (with `carried: true`) until they are answered or no longer relevant; if later input settles an item, drop it and say so in one line.
- Meanwhile: a question's or assumption's stated default applies (say so in one line); proposals and statements without a default stand as written; do not proceed with work that a blocking question without a default holds up.
- The user may also answer in plain text instead of the table; accept that.

## Fallback

If show_widget is not available in the session, list the items as a numbered markdown list with the same IDs and types, and ask the user to reply in the form "ID: answer".
