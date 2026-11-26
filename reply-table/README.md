# Reply table

A [Claude](https://claude.ai) skill that makes long, question-heavy conversations easier to answer.

On long projects Claude's replies often contain many questions, assumptions, proposals and findings. Replying to all of them in a free-text message is tedious and error-prone. With this skill, Claude puts everything that needs your reaction into an interactive table instead: its statements on the left, your input fields on the right, and one **Send replies** button that returns all answers as a single structured message.

<!-- Add a screenshot here: docs/screenshot.png -->

## What you get

| Item type | ID | Your input |
|---|---|---|
| Question | Q1, Q2, ... | Answer buttons (single or multi-select) or a free-text field for open questions |
| Assumption | A1, ... | Confirm / Reject / Modify |
| Proposal | P1, ... | Accept / Reject / Modify |
| Statement | S1, ... | Agree / Disagree / Unclear |

- Every row also has a free-text comment field. **A comment always prevails over the button you clicked.**
- Selected buttons are filled and show a check mark, so you can see what you've chosen.
- Questions and assumptions can show a default ("If unanswered: ...") that applies if you leave them blank.
- **Unanswered items of any type come back** in the next table, marked "carried over", until you answer them or they stop being relevant.
- One table per reply, at most 20 rows.
- The skill runs only when you ask for it. It never switches itself on.

Your replies come back to Claude in this form:

```
Review replies — Topic of this round:
Q1: Option B
Q2: X, Z
Q3: free text answer
A1: Modify — only for EU
Not answered: P1, S1
```

## Installation

1. Download this repository and zip the `reply-table` folder so that `SKILL.md` is inside it. (`SKILL.md` is the only file Claude needs; the README and tests are for humans.)
2. In Claude, open **Settings → Capabilities → Skills** and upload the zip. (The exact menu names may differ between versions and plans; check Anthropic's current documentation on adding custom skills.)

## Usage

- **Single chat:** say "use the reply table" (or "table mode") at any point.
- **Whole project:** add this line to the project instructions:

  > Use the reply-table skill whenever your response contains questions or statements I may want to comment on.

To stop, tell Claude to stop using the reply table.

## Requirements and limitations

- The table is an inline widget rendered by Claude's visualizer (`show_widget`). It works in chat interfaces that support it. It will not render in a plain API integration or a terminal session. In that case the skill falls back to a numbered list; reply in the form `ID: answer`.
- The widget uses the host's style variables (for example `--fill-accent`, `--bg-neutral`) with fallbacks for the selected-button color. Other colors follow the host theme, so appearance can vary between clients.
- Inline tables are not saved. If you reload the page before pressing **Send replies**, your entries are lost. After sending, they remain in the chat as your message.
- Each table adds some length and time to a reply, so for short answers plain text is quicker.

## Folder contents

```
SKILL.md        the skill (instructions and the widget template)
test/test.js    automated checks of the widget template
package.json    test runner configuration
```

The widget template exists only inside `SKILL.md`. The tests extract it from there, so what is tested is exactly what ships.

## Development

```
npm install
npm test
```

The tests run the template in a simulated browser (jsdom) and check selection and highlighting, multi-select, deselecting, the counter, error handling, and the exact format of the reply message. They do not check how the widget looks in a real client; check that by hand after changing the styles.

When changing the template, keep these in mind:

- Selected-button styling is set with inline `!important` styles on purpose. Host button styles otherwise override it and the selection becomes invisible.
- Item text is inserted with `textContent`, never as HTML. Keep it that way.
- Update the README table and the skill's "Item types" section together if you add an item type.

## License

MIT, see [LICENSE](../LICENSE) in the repository root.
