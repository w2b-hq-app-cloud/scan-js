import orderPlatformYaml from "@/samples/order-platform.yaml?raw";
import { parseSphereYaml } from "@spherescan/model";
import { projectToGraph, type BoardGraph } from "@spherescan/viewer";

export function loadSampleBoard(viewId = "architecture-board"): BoardGraph {
  const model = parseSphereYaml(orderPlatformYaml);
  return projectToGraph(model, viewId);
}

export const sampleBoard = loadSampleBoard();
