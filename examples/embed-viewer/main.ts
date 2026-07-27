import { ScanViewer } from "@spherescan/viewer";
import yaml from "../../packages/model/fixtures/order-platform.yaml?raw";

const viewer = new ScanViewer({ container: "#diagram" });
await viewer.importYAML(yaml);
