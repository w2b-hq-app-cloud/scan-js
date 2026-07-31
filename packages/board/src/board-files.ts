// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 WABLOO PARTNERS SRL

export function isScanFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".scan") ||
    name.endsWith(".yaml") ||
    name.endsWith(".yml") ||
    file.type === "application/x-yaml" ||
    file.type === "text/yaml"
  );
}

export function isAiAttachmentFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "text/plain" ||
    file.type === "text/markdown" ||
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    name.endsWith(".txt") ||
    name.endsWith(".md") ||
    name.endsWith(".png") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg")
  );
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error(`Failed to read ${file.name}`));
    reader.readAsText(file);
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

export const MAX_VOICE_MS = 60_000;
export const MAX_VOICE_BYTES = 10 * 1024 * 1024;
