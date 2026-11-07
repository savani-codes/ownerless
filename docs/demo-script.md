# Demo script

About 3 minutes. JARS records on the demo laptop (screen: Discord on the left, Airflow and
DataHub tabs on the right). SAV joins the room from a second machine.

## Before each take

```bash
scripts/preflight.sh            # everything ok
ownerless scenario reset
ownerless scenario break
ownerless scenario trigger      # waits until the run fails
```

Clear the thread, or start a new one. Open the failed run in Airflow and `raw.products` in DataHub
(Owners empty) so the tabs are ready.

## Shots

| Time | Screen | Say |
| --- | --- | --- |
| 0:00 | Airflow: the failed `nightly__…` run, `validate_orders` red | "2 AM. The revenue pipeline failed. Normally this is an hour of tabs and a Slack hunt for an owner." |
| 0:15 | Discord, `#retail-incidents`: two people, two agents | "This is a Switch room. Two of us, and two Claude Code agents: one can only read, the other can only change things we approve." |
| 0:25 | JARS types `daily_revenue didn't refresh last night, what happened? @investigator` | (nothing; let it type) |
| 0:30 | The investigator's first line, then its tool calls | "It reads Airflow, the logs, the warehouse and DataHub through one CLI. No permission needed to read." |
| 1:00 | The report: evidence, root cause chain, **no owner** | "Three products were deleted upstream. And the table they came from has no owner in DataHub." |
| 1:15 | The investigator asks the room and suggests Data Platform, hands a, b, c to `@operator` | "It doesn't guess. It asks who owns it, and offers the likeliest group." |
| 1:25 | SAV: "Data Platform owns products, I approve a, b and c" | "SAV leads Data Platform. That message is key one." |
| 1:35 | Operator step a, the permission prompt, JARS clicks **Allow** | "Every change stops for a person. That click is key two." |
| 1:50 | DataHub tab: Owners now shows Data Platform | "The table has an owner, for good." |
| 2:00 | Steps b and c, two more Allows | "Products restored, the failed tasks rerun." |
| 2:20 | Airflow: the run is green | |
| 2:30 | The incident log room document, the summary | "It checks the revenue table and writes the incident log for the morning." |
| 2:45 | README: "How Switch is used" table, then the repo | "Two people, two messages, three clicks. Template, agents and CLI are all in the repo." |

## If something goes wrong

| Problem | Do |
| --- | --- |
| An agent is slow | Keep recording; trim it in the edit |
| `memory ask` errors | The investigator moves on; it's optional |
| A wrong step | Decline the prompt. That's a good shot too: "nothing happens without us." Then reset and retake |
| The run didn't fail | `ownerless scenario status`, then reset, break, trigger again |
