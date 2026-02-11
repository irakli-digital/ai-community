# Agentic Tribe - Markdown Content Template

This file is a reference for AI agents writing lesson and community post content for the Agentic Tribe platform. It documents every supported markdown feature and shows how to use them effectively.

---

## Supported Features

### 1. Headings (h2 - h4)

Use `##`, `###`, and `####` for structure. Headings generate anchor links and feed the Table of Contents sidebar. **Do not use `#` (h1)** — the page title is handled by the platform.

```markdown
## Section Title
### Subsection
#### Detail
```

- `##` renders with a bottom border separator — use it for major sections
- `###` and `####` are plain bold headings for subsections
- Use at least 2 headings to trigger the Table of Contents sidebar

---

### 2. Text Formatting

```markdown
**bold text**
_italic text_
**_bold and italic_**
`inline code`
~~strikethrough~~
```

- **Bold** renders in full foreground color (cream on dark)
- `inline code` renders with a subtle background pill

---

### 3. Links

```markdown
[Link text](https://example.com)
```

- External links (http/https) automatically open in a new tab
- Links are styled in terracotta (primary color) with underline

---

### 4. Images

```markdown
![Caption text goes here](https://example.com/image.png)
```

- The alt text becomes a visible caption below the image (`<figcaption>`)
- Images are rounded with `border-radius: 0.5rem`
- Always provide descriptive alt text — it doubles as the caption

---

### 5. Code Blocks (Syntax Highlighted)

Use fenced code blocks with a language identifier. The platform uses Shiki with a custom warm dark theme for syntax highlighting.

````markdown
```python
def greet(name: str) -> str:
    return f"Hello, {name}!"
```
````

**Supported languages include:** `python`, `javascript`, `typescript`, `jsx`, `tsx`, `bash`, `json`, `yaml`, `sql`, `html`, `css`, `go`, `rust`, `java`, `c`, `cpp`, and many more (any language Shiki supports).

Each code block renders with:
- A header bar showing the language label
- A "Copy" button for one-click copying
- Warm dark syntax theme matching the platform palette

For plain text without highlighting, use `text` or omit the language:

````markdown
```text
Plain output here
```
````

---

### 6. Callout Blocks (Alerts)

Use GitHub-style alert syntax. Five types are available, each with a distinct color and icon:

```markdown
> [!TIP]
> Helpful advice for the reader.

> [!NOTE]
> Additional context or background info.

> [!WARNING]
> Something the reader should be careful about.

> [!CAUTION]
> Potential danger or destructive action.

> [!IMPORTANT]
> Critical information the reader must know.
```

| Type | Color | Use for |
| --- | --- | --- |
| `[!TIP]` | Terracotta (primary) | Best practices, shortcuts, recommendations |
| `[!NOTE]` | Green | Extra context, background info |
| `[!WARNING]` | Amber | Things to watch out for, common mistakes |
| `[!CAUTION]` | Red (destructive) | Dangerous actions, data loss risks |
| `[!IMPORTANT]` | Ring accent | Must-know info, prerequisites |

Callouts can contain any markdown inside them (bold, code, links, etc.).

---

### 7. Text Highlighting (Marker)

Use `==text==` syntax to highlight text. Supports optional color prefixes.

```markdown
==default highlight==
==yellow:yellow highlight==
==green:green highlight==
==blue:blue highlight==
==red:red highlight==
==purple:purple highlight==
```

| Syntax | Color | Use for |
| --- | --- | --- |
| `==text==` | Terracotta | Default emphasis, key terms |
| `==yellow:text==` | Yellow | Important definitions, warnings |
| `==green:text==` | Green | Positive outcomes, correct examples |
| `==blue:text==` | Blue | References, links, technical terms |
| `==red:text==` | Red | Errors, wrong examples, critical info |
| `==purple:text==` | Purple | Special notes, creative emphasis |

- Highlighted text renders with a solid background and dark text for readability
- The editor toolbar has a Highlighter button with a color picker dropdown
- Use sparingly for maximum impact — highlighting everything defeats the purpose

---

### 8. Tables (GFM)

```markdown
| Tool | Purpose | Price |
| --- | --- | --- |
| Claude | AI assistant | Free / Pro |
| Cursor | AI code editor | $20/mo |
| v0 | UI generator | Free / Pro |
```

- Tables are styled with hover rows, a bold header with bottom border, and responsive horizontal scrolling
- Use `---` alignment (no need for `:---:` unless you want centered text)

---

### 9. Lists

**Unordered:**
```markdown
- First item
- Second item
  - Nested item
  - Another nested item
- Third item
```

**Ordered:**
```markdown
1. Step one
2. Step two
   1. Sub-step
   2. Another sub-step
3. Step three
```

- Markers are styled in muted foreground
- Nesting is supported to any depth

---

### 10. Blockquotes

```markdown
> This is a blockquote. Use it for quotes or
> emphasis on a passage.
```

- Renders with a left border, subtle background, and muted text
- For informational callouts, prefer the alert syntax (`[!TIP]` etc.) over plain blockquotes

---

### 11. Horizontal Rule

```markdown
---
```

- Renders as a subtle `1px` border line with generous vertical spacing
- Use to separate major topic shifts within a section

---

### 12. Strikethrough (GFM)

```markdown
~~deprecated approach~~
```

---

### 13. Task Lists (GFM)

```markdown
- [x] Completed task
- [ ] Pending task
- [ ] Another pending task
```

---

## Article Structure Template

Below is the recommended structure for a lesson or guide. Copy and adapt it.

```markdown
## Introduction

Brief overview of what the reader will learn and why it matters.

> [!NOTE]
> Prerequisites or assumed knowledge goes here.

## Core Concept

Explain the main idea. Use **bold** for key terms on first use.

### How It Works

Detailed explanation with examples.

` ` `python
# Example code demonstrating the concept
def example():
    return "Hello, World!"
` ` `

### Step-by-Step

1. First step — explain what to do
2. Second step — include code if needed
3. Third step — verify the result

> [!TIP]
> Pro tip or shortcut related to these steps.

## Practical Example

Walk through a real-world use case.

| Input | Output | Notes |
| --- | --- | --- |
| Example A | Result A | Explanation |
| Example B | Result B | Explanation |

## Common Mistakes

> [!WARNING]
> Describe a common pitfall and how to avoid it.

> [!CAUTION]
> Describe a dangerous mistake that could cause real problems.

## Summary

- Key takeaway 1
- Key takeaway 2
- Key takeaway 3

---

## Next Steps

Link to related lessons or external resources:
- [Related Topic](/classroom/course-slug/lesson-id)
- [External Resource](https://example.com)
```

---

## Writing Guidelines

1. **Language**: All user-facing text is in Georgian (ka). Code and technical terms stay in English.
2. **Headings**: Start with `##`. Use `###` and `####` for nesting. This creates a good Table of Contents.
3. **Code blocks**: Always specify the language. Use `bash` for terminal commands, `text` for plain output.
4. **Callouts**: Use sparingly — 2-4 per article. They lose impact when overused.
5. **Tables**: Great for comparisons, feature lists, and reference data.
6. **Images**: Provide a descriptive alt text — it becomes the visible caption.
7. **Length**: Aim for scannable content. Use headings every 2-3 paragraphs.
8. **First heading**: Don't repeat the lesson/post title as an `##` heading — it's already shown by the platform.
