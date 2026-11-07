# The Switch setup

`ownerless.template.yaml` is everything Switch needs to run Ownerless: the two agents, the room,
the room's rules, a group directory, and a kickoff message.

## Create the room

1. Install [Switch Console](https://github.com/sandbox-quantum/switch/releases/latest) **0.40.1 or
   newer** (Windows: `switch-console-x64.exe`), choose **On this computer**, and sign in to Claude
   Code as the agents' provider. Older Windows builds can't run agents on Windows at all (see
   [Troubleshooting](#troubleshooting)).
2. Connect Discord on the server's **Home** page (**Messaging apps > Connect > Discord**). We use
   Discord because it connects outward and both of us can join from our own machines. You need a
   bot first; see [Discord bot](#discord-bot) below.
3. Remove the bundled **Mattermost** messaging app if it is listed. We don't use it, and when its
   container doesn't start it slows every template run down until it times out.
4. Link your own Discord account ("This is me"), so the agents know you are their owner.
5. **Templates > Import** `switch/ownerless.template.yaml`, then **Use template** and fill in:
   - **Repository folder**: the folder you cloned this repo into, with no trailing slash (for
     example `E:\work\ownerless`). Each agent card should then show `<folder>/agents/investigator`
     or `<folder>/agents/operator`
   - **owner**: your teammate's username on the messaging app
6. **Create all**. Switch makes `#retail-incidents`, both agents, and the kickoff thread.
7. Prove it in the channel (not the thread): `@investigator in one line: what do you do, and what
   will you never do?` The answer should quote its CLAUDE.md: read-only, numbered fixes for
   @operator. The two "Hey, I'm ready" lines posted when the agents join are Switch's, not Claude's.

## Discord bot

1. [Discord Developer Portal](https://discord.com/developers/applications) > **New Application**
   ("Agent Switch"). On **Bot**, copy the token (reset it if hidden) and keep it in a password
   manager. Never paste it into a chat or a file in this repo.
2. Still on **Bot**, turn on **Server Members Intent** and **Message Content Intent**, then **Save
   Changes**. Without Message Content the agents receive empty messages.
3. **OAuth2 > URL Generator**: scopes `bot` **and** `applications.commands`; permissions View
   Channels, Send Messages, Send Messages in Threads, Manage Webhooks, Manage Channels, Manage
   Roles, Read Message History, Attach Files. Open the URL and add the bot to your server.
4. Discord **User Settings > Developer > Developer Mode**, then right-click the server icon >
   **Copy Server ID**. Switch calls it the Guild Id.
5. Invite your teammate to the server **before** running the template, so the owner lookup finds them.

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

## Troubleshooting

Everything below happened to us on the demo laptop (Windows 11) on 7 Nov 2026.

| What you see | Why | Fix |
| --- | --- | --- |
| Every provider says **Not supported here**; "No agent type is set up for Switch on this computer" | Switch Console before 0.40.1 refuses to run agents on Windows ("SDK sessions require a POSIX SSH execution host") | Update Switch Console to 0.40.1 or newer and restart it |
| The folder field won't take a pasted path, and backspace turns it into `agents/investigator` | An older template asked for the folder with a folder picker | Use the template in this repo: the field is plain text now |
| "Could not reach http://localhost:49840" | Switch's local server stopped (its Postgres keeps running, so nothing is lost) | Quit Switch Console from the tray icon, not the window, and reopen it |
| "Invalid YAML: expected a document, but the input is empty" | A template saved in Switch came through empty | **Templates > Import** the file again instead of using the saved copy |
| The template run stops with "The operation was aborted due to timeout" | The bundled Mattermost isn't running, and the server waits on it while it sets up each agent. The run often finishes on the server anyway | Remove Mattermost (step 3), check Discord, then run the template again: `allow_existing` reuses agents that were already made |
| The agents ignore you after a Switch Console restart | The Discord bridge crashed on startup: "Discord gateway not ready after 30s" in the server log | Reconnect Discord on **Home > Messaging apps**, or restart Switch Console once more |
| Slash commands don't appear in Discord | The bot was invited without `applications.commands` | Rebuild the invite URL with both scopes, re-invite, restart the connection |
| A WSL or Linux machine added under **Remote hosts** never gets ready from a Windows Console: "Claude Code · CLI not installed", "SSH agent socket not found" | The Windows Console checks remote hosts with Windows `where` and only accepts `C:\...` paths, and it signs in through the Windows ssh-agent | Don't use a remote host for this demo. With 0.40.1+ the agents run on Windows next to the data stack |

### Where to look

| What | Where (Windows) |
| --- | --- |
| Switch Console log | `%APPDATA%\switchdash\logs\switch-console.log` |
| Switch server log (local time) | `%APPDATA%\switchdash\local-switch-server\native\logs\switch-core.log` |
| What an agent actually did | `%USERPROFILE%\.claude\projects\<repo path>-agents-investigator\*.jsonl` (and `-operator`) |
| Is the data stack ready | `scripts/preflight.sh` |
