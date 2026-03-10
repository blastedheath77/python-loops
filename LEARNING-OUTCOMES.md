# Python Loops — Learning Outcomes by Page

A summary of the knowledge and skills acquired by completing each page of the course.

---

## Page 1 — Why Loops?
**Phase:** Foundations

### Concepts learned
- **The problem loops solve:** Repetitive tasks (like printing "Hello" 50 times) would require duplicating code line after line without loops
- **Loops as automation:** One loop instruction can replace hundreds of identical lines
- **The two loop types in Python:** `while` (repeats while a condition is true) and `for` (steps through a sequence automatically)
- **Code efficiency:** 2 lines of loop code can produce the same output as 50 lines of manual code

### Skills practised
- Experiencing the tedium of copy-paste programming (interactive widget)
- Running a `for` loop and observing its output
- Comparing manual vs automated approaches side by side

---

## Page 2 — The While Loop
**Phase:** Foundations

### Concepts learned
- **While loop syntax:** `while condition:` followed by an indented body
- **Condition checking:** The condition is evaluated *before* every iteration
- **True vs False branching:** If the condition is True, the body runs; if False, the loop exits
- **Counter variables:** Initialising a counter (`count = 0`), using it in the condition (`count < 5`), and updating it inside the body (`count = count + 1`)
- **Loop flow:** Init → Check → Body → Check → Body → ... → Check (False) → Exit
- **Infinite loop danger:** If the condition never becomes False, the program freezes

### Skills practised
- Stepping through a while loop line by line, observing variable changes
- Reading condition badges that show True/False evaluation at each check
- Following a flowchart of while loop execution
- Tracking iteration count (1 of 5, 2 of 5, etc.)

---

## Page 3 — Infinite Loops & Conditions
**Phase:** Foundations

### Concepts learned
- **Infinite loops:** What they are and why they happen
- **Three causes of infinite loops:**
  1. Missing increment — the loop variable never changes
  2. Wrong comparison — using `!=` when the counter can skip past the target value
  3. Wrong direction — incrementing when you should be decrementing (or vice versa)
- **The termination checklist:** (1) Is the variable being changed? (2) Is it changing in the right direction? (3) Will it actually reach the stopping value?
- **Safe comparison operators:** Using `<` or `>` instead of `!=` for numeric conditions

### Skills practised
- Predicting whether buggy code will loop infinitely
- Diagnosing the root cause of three different infinite loop bugs
- Writing corrected code and verifying the fix with a step-through animation
- Sequential problem-solving (bugs unlock progressively)

---

## Page 4 — The For Loop
**Phase:** Core Concepts

### Concepts learned
- **For loop syntax:** `for variable in sequence:` followed by an indented body
- **Automatic iteration:** Python creates, checks, and updates the loop variable — no manual counter needed
- **`range(n)`:** Produces the sequence `0, 1, 2, ..., n-1`
- **While vs For comparison:** A `while` loop needs 4 lines (init, condition, body, increment); a `for` loop needs just 2 lines for the same result
- **When to use `for`:** When you have a known sequence or count to iterate over

### Skills practised
- Stepping through both loop types simultaneously, side by side
- Observing how the `for` loop handles counter management automatically
- Comparing execution trace length (while = more steps, for = fewer steps)

---

## Page 5 — range() Unpacked
**Phase:** Core Concepts

### Concepts learned
- **Three forms of `range()`:**
  - `range(stop)` — counts from 0 to stop-1
  - `range(start, stop)` — counts from start to stop-1
  - `range(start, stop, step)` — counts from start in increments of step
- **Exclusive stop:** The stop value is never included in the range
- **Negative step:** Enables counting backwards (e.g., `range(10, 0, -1)`)
- **Empty ranges:** Occur when start/stop/step combination produces no valid values
- **Counting patterns:** Even numbers (`step=2`), countdowns (`step=-1`), multiples (`step=3`)

### Skills practised
- Manipulating sliders to explore start, stop, and step interactively
- Reading a number line visualisation showing which values are included
- Using preset buttons to see common patterns (count to 10, even numbers, countdown, count by 3s)
- Predicting how many numbers a given range will produce

---

## Page 6 — Looping Through Lists
**Phase:** Core Concepts

### Concepts learned
- **Iterating non-numeric sequences:** `for` loops work on lists of strings, mixed values, and more — not just numbers
- **Value-based iteration:** The loop variable receives each item's *value*, not its index
- **Natural readability:** `for colour in colours:` reads like English
- **Strings as sequences:** A string can be iterated character by character (`for char in "hello":`)
- **Order matters:** The loop processes items in the order they appear in the list

### Skills practised
- Stepping through a list iteration and watching which item is currently active
- Dragging colour cards to reorder a list, then running the loop with the new order
- Observing how output order changes when the list order changes

---

## Page 7 — Break & Continue
**Phase:** Core Concepts

### Concepts learned
- **`break` statement:** Immediately exits the entire loop — used for searching (stop once found) or enforcing limits
- **`continue` statement:** Skips the rest of the current iteration and jumps to the next one — used for filtering (ignore some items)
- **`break` exits the innermost loop only** (relevant for nested loops)
- **`continue` keeps the loop running** — it just skips one iteration
- **Both work in `while` and `for` loops**
- **Combining break and continue:** A single loop can use both to filter items and exit early

### Skills practised
- Watching a flow control visualisation that shows exactly when `break` and `continue` trigger
- Predicting the output of code that uses both `break` and `continue` (multiple-choice quiz)
- Stepping through the quiz answer to verify understanding

---

## Page 8 — Choosing the Right Loop
**Phase:** Synthesis

### Concepts learned
- **Decision heuristic for while vs for:**
  - **Use `for` when:** you have a list to process, know the exact count, are iterating a fixed sequence, or the end is determined by data
  - **Use `while` when:** the stop condition is unpredictable, you're waiting for user input, you need to retry until something works, or the loop count isn't known upfront
- **Real-world scenario mapping:** Matching problem descriptions to the appropriate loop type
- **"When in doubt" rule:** If you can express the repetition with `range()` or a list, use `for`

### Skills practised
- Categorising 8 real-world scenarios into `for` or `while` (drag-and-drop sorting)
- Reading explanations for why each scenario fits its loop type
- Self-assessment with scoring and feedback

---

## Page 9 — Loops in the Wild
**Phase:** Synthesis

### Concepts learned
- **Five essential loop patterns:**
  1. **Accumulator** — start at 0, add each item to get a total (sum, product, count)
  2. **Search** — loop until you find a match, then `break`
  3. **Filter** — use an `if` condition to skip or select items
  4. **Build list** — start with an empty list, `append()` qualifying items
  5. **Input validation** — use `while` to keep asking until valid input is given
- **Pattern recognition:** Identifying which pattern fits a given problem accelerates writing loops

### Skills practised
- Stepping through an accumulator loop with a bar chart showing running totals
- Editing numbers and re-running the accumulator to see how totals change
- Running a search loop with different targets (including one not in the list)
- Adjusting a filter threshold slider and seeing filtered output update live
- Simulating password input validation in an interactive terminal

---

## Page 10 — The Loop Lab
**Phase:** Final Challenge

### Concepts learned
- **Combining all loop concepts:** Variables, conditions, counters, `for`, `while`, `break`, `continue`, `if`, and `range()` work together to solve real problems
- **Algorithmic thinking:** Breaking a complex task (navigating a maze) into a sequence of simple instructions
- **Block-based programming:** Constructing a program by assembling and ordering instruction blocks
- **Wall detection / conditionals in action:** Using `if wall_ahead` to decide when to turn
- **Iterative problem solving:** Testing, observing failure, adjusting, and re-running

### Skills practised
- **Level 1 (Straight Line):** Using a `for` loop with `move_forward` to traverse a simple path
- **Level 2 (L-Shape):** Combining `move_forward`, `turn_right`, and sequencing to navigate a corner
- **Level 3 (Spiral Maze):** Using `while` loops, `if wall_ahead`, `turn_right`, and `move_forward` together to navigate a maze with walls — requiring conditional logic and loop control
- Dragging, reordering, and indenting code blocks to build working programs
- Debugging programs by watching the robot's path and adjusting the code

---

## Cumulative Knowledge Map

| Concept | Introduced | Reinforced |
|---|---|---|
| Why loops exist | Page 1 | All pages |
| `while` loop syntax & mechanics | Page 2 | Pages 3, 8, 9, 10 |
| Condition checking (True/False) | Page 2 | Pages 3, 7 |
| Infinite loops & how to avoid them | Page 3 | — |
| Counter variables | Pages 2-3 | Pages 4, 5 |
| `for` loop syntax | Page 4 | Pages 5, 6, 7, 9, 10 |
| `range()` (1, 2, and 3 arguments) | Pages 4-5 | Page 9 |
| Iterating lists & strings | Page 6 | Pages 7, 9 |
| `break` | Page 7 | Pages 9, 10 |
| `continue` | Page 7 | Page 9 |
| Choosing while vs for | Page 8 | Pages 9, 10 |
| Accumulator pattern | Page 9 | Page 10 |
| Search pattern | Page 9 | — |
| Filter pattern | Page 9 | — |
| Input validation pattern | Page 9 | — |
| Combining all concepts | Page 10 | — |
