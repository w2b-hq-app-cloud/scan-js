/**
 * SCAN whiteboard â€” same interactive board as Sphere (`@spherescan/board`),
 * with OSS chrome only (`shell="scan"`).
 */
import BoardApp from "@spherescan/board";

export default function ScanApp() {
  return <BoardApp shell="scan" />;
}
