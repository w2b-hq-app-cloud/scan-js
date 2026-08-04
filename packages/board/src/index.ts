// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

export { default } from "./BoardApp";
export { default as BoardApp } from "./BoardApp";
export type {
  Point,
  BoardTool,
  ResizeHandle,
  BoardAppProps,
  BoardHostApi,
  BoardSelection,
  BoardNodeOverlayContext,
  BoardInspectorExtrasContext,
  ArchitectureWarning,
  SystemIdentityChange,
} from "./board-types";
export { Modal, type ModalAction, type ModalTone } from "./Modal";
export { kindMeta } from "./kinds";
export {
  useScanBoard,
  useSphereBoard,
  diagramBasename,
  type UseScanBoardOptions,
} from "./useScanBoard";
