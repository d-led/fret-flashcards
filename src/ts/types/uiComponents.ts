/**
 * UI Component Interfaces
 * Defines interfaces for jQuery-based UI components that can be injected into modules
 */

export interface UISelector {
  getValue(): string;
  setValue(value: string): void;
  on(event: string, handler: (event: any) => void): void;
}

export interface UICheckbox {
  isChecked(): boolean;
  setChecked(checked: boolean): void;
  on(event: string, handler: (event: any) => void): void;
}

export interface UIInput {
  getValue(): string;
  setValue(value: string): void;
  on(event: string, handler: (event: any) => void): void;
}

export interface UIDropdown {
  getValue(): string;
  setValue(value: string): void;
  on(event: string, handler: (event: any) => void): void;
  getOptions(): string[];
  setOptions(options: string[]): void;
}

export interface UIBanner {
  show(): void;
  hide(): void;
  isVisible(): boolean;
  setText(text: string): void;
  addClass(className: string): void;
  removeClass(className: string): void;
  on(event: string, handler: (event: any) => void): void;
}

export interface UIRow {
  show(): void;
  hide(): void;
  toggle(show: boolean): void;
}

export interface UIComponents {
  fretCount: UISelector;
  showAccidentals: UICheckbox;
  timeoutSeconds: UIInput;
  numStrings: UISelector;
  enableBias: UICheckbox;
  showScoreNotation: UICheckbox;
  scoreKey: UISelector;
  hideQuizNote: UICheckbox;
  enableTTS: UICheckbox;
  selectedVoice: UIDropdown;
  unifiedBanner: UIBanner;
  scoreKeyRow: UIRow;
  hideQuizNoteLabel: UIRow;
  voiceSelection: UIRow;
}
