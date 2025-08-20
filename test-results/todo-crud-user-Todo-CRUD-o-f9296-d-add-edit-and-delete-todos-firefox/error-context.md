# Page snapshot

```yaml
- heading "Todo List App" [level=1]
- navigation:
  - link "Home":
    - /url: /
  - link "Create Todo":
    - /url: /create
  - button "Logout"
- heading "Todo List" [level=2]
- link "Create New Todo":
  - /url: /create
- textbox "Filter by Title": Buy milk [153031]
- combobox:
  - option "All" [selected]
  - option "Completed"
  - option "Not Completed"
- table:
  - rowgroup:
    - row "Title Completed Start Date End Date Actions":
      - cell "Title"
      - cell "Completed"
      - cell "Start Date"
      - cell "End Date"
      - cell "Actions"
  - rowgroup:
    - row "No todos found.":
      - cell "No todos found."
```