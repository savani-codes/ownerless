# The Switch setup

`ownerless.template.yaml` is everything Switch needs to run Ownerless: the two agents, the room,
the room's rules, a group directory, and a kickoff message.

## Create the room

1. Install [Switch Console](https://github.com/sandbox-quantum/switch/releases/latest) (Windows:
   `switch-console-x64.exe`), choose **On this computer**, and sign in to Claude Code as the
   agents' provider.
2. Connect your messaging app on the server's **Home** page. We use Discord, because it connects
   outward and both of us can join from our own machines. The bundled Mattermost also works.
3. Link your own chat account ("This is me"), so the agents know you are their owner.
4. **Your Rooms > Create from template**, choose `switch/ownerless.template.yaml`, and fill in:
   - **Repository folder**: the folder you cloned this repo into, typed with forward slashes and
     no trailing slash (for example `E:/work/ownerless`). Each agent card should then show
     `<folder>/agents/investigator` or `<folder>/agents/operator`
   - **owner**: your teammate's username on the messaging app
5. The kickoff posts in `#retail-incidents`, and both agents introduce themselves.

## What each part does

| Part | Why it's there |
| --- | --- |
| `directory: {repo_dir}/agents/<name>` | Claude Code starts in that folder, so it loads that agent's `CLAUDE.md` and `.claude/settings.json` and nothing else |
| `auto_mode: false` | Claude Code doesn't decide on its own which commands are safe. The settings file decides: reads are allowlisted, every change raises a Switch permission prompt |
| `addressing: anyone` | Both people in the room can talk to both agents, and the investigator can hand off to the operator |
| `room.instructions` | Read by every agent when it joins: the workflow and the two-key rule |
| `room.docs` Group directory | Maps DataHub owner groups to the people in the room, so the agents know whom to tag |
| `kickoff` | Agents only start when addressed, so the kickoff makes both say hello |

## Who can answer permission prompts

By default only an agent's owner (the person who created it from this template) can answer its
permission prompts. That's the second key: the dataset owner approves the change in the thread,
and the agents' owner allows each command to run.
