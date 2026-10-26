import { describe, expect, it } from "vite-plus/test";
import { CIRCUIT_PRESETS } from "../presets/circuits";
import { ANNEAL_PRESETS } from "../presets/problems";
import { GLOSSARY, glossaryEntry, termsIn } from "./glossary";

describe("glossary", () => {
  it("has unique ids and a meaning for every word", () => {
    expect(new Set(GLOSSARY.map((e) => e.id)).size).toBe(GLOSSARY.length);
    for (const e of GLOSSARY) expect(e.short.length, e.id).toBeGreaterThan(10);
  });

  it("explains superposition as a state and interference as a phenomenon", () => {
    expect(glossaryEntry("superposition").short).toContain("状態");
    const interference = glossaryEntry("interference").short;
    expect(interference).toContain("現象");
    expect(interference).toContain("強め合い");
    expect(interference).toContain("打ち消し合い");
  });

  it("finds words in order of appearance and honours skip", () => {
    const text = "CNOT で q1 を反転し、2つが「もつれた」状態に。振幅は変わらない。";
    expect(termsIn(text).map((t) => t.id)).toEqual(["cnot", "entanglement", "amplitude"]);
    expect(termsIn(text, ["cnot"]).map((t) => t.id)).toEqual(["entanglement", "amplitude"]);
  });

  it("does not read 基底エネルギー as a measurement basis", () => {
    expect(termsIn("基底エネルギー").map((t) => t.id)).toEqual(["ground", "energy"]);
  });

  it("covers the jargon used in the presets", () => {
    const text = [
      ...CIRCUIT_PRESETS.flatMap((p) => [p.summary, ...p.notes]),
      ...ANNEAL_PRESETS.map((p) => p.summary),
    ].join("\n");
    const ids = new Set(termsIn(text).map((t) => t.id));
    for (const id of [
      "amplitude",
      "phase",
      "measurement",
      "entanglement",
      "basis",
      "oracle",
      "diffusion",
      "cnot",
      "qubo",
      "penalty",
      "frustration",
      "interference",
      "superposition",
    ])
      expect(ids.has(id), id).toBe(true);
  });
});
