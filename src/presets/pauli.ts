import type { PauliOp, PauliTerm } from "../quantum/vqe";

/** "ZIXY" (qubit 0 first, I = identity) and a coefficient → one run_vqe Hamiltonian term. */
export const pauliTerm = (ops: string, coeff: number): PauliTerm => ({
  coeff,
  paulis: ops.split("").flatMap((op, qubit) => (op === "I" ? [] : [{ op: op as PauliOp, qubit }])),
});
