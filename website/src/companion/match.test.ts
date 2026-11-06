import { describe, expect, it } from "vitest";
import { knowledge, starters } from "./knowledge";
import { answer, rank, stem, tokenize } from "./match";

const ask = (question: string) => answer(question, knowledge)?.id ?? null;

describe("tokenize", () => {
  it("lowercases, strips punctuation and @, and stems", () => {
    expect(tokenize("What do the @operator Agents do?")).toEqual(["what", "do", "the", "operator", "agent", "do"]);
  });
  it("maps synonyms before stemming", () => {
    expect(stem("bots")).toBe("agent");
    expect(stem("permissions")).toBe("permission");
  });
});

describe("answer", () => {
  it.each([
    ["what is ownerless?", "what"],
    ["How does it work", "how"],
    ["is it safe? can the AI break prod", "keys"],
    ["what happens if I click decline", "decline"],
    ["why does a missing owner matter", "owner"],
    ["what breaks in the demo scenario", "scenario"],
    ["why drop the foreign key", "fk"],
    ["how do I install and run it on windows", "run"],
    ["what does cognee do", "memory"],
    ["why discord and not slack", "discord"],
    ["who built this", "team"],
    ["what's the license", "license"],
    ["are you a real AI?", "companion"],
    ["how is switch used", "switch"],
    ["what's the architecture", "stack"],
    ["what is the cli", "cli"],
  ])("%s → %s", (question, id) => {
    expect(ask(question)).toBe(id);
  });

  it("returns null for questions it can't answer", () => {
    expect(ask("what's the weather in Pune")).toBeNull();
    expect(ask("")).toBeNull();
    expect(ask("???")).toBeNull();
  });

  it("ranks best first", () => {
    const ranked = rank("approval permission prompt", knowledge);
    expect(ranked[0]?.entry.id).toBe("keys");
    expect(ranked.every((m, i) => i === 0 || ranked[i - 1]!.score >= m.score)).toBe(true);
  });
});

describe("knowledge", () => {
  it("has unique ids and only links to entries that exist", () => {
    const ids = knowledge.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of [...starters, ...knowledge.flatMap((e) => e.next ?? [])]) expect(ids).toContain(id);
  });

  it("answers every canonical question with its own entry", () => {
    for (const entry of knowledge) expect(ask(entry.question)).toBe(entry.id);
  });

  it("never names the team by their real names", () => {
    const text = JSON.stringify(knowledge).toLowerCase();
    expect(text).not.toMatch(/jishan|savani(?!-codes)/);
  });
});
