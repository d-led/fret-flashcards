/**
 * jQuery-based UI Components
 * Concrete implementation of UI component interfaces using jQuery
 */

import { UIComponents, UISelector, UICheckbox, UIInput, UIDropdown, UIBanner, UIRow } from "../types/uiComponents";

export class JQueryUISelector implements UISelector {
  constructor(private $element: JQuery<HTMLElement>) {}

  getValue(): string {
    return this.$element.val() as string;
  }

  setValue(value: string): void {
    this.$element.val(value);
  }

  on(event: string, handler: (event: any) => void): void {
    this.$element.on(event, handler);
  }
}

export class JQueryUICheckbox implements UICheckbox {
  constructor(private $element: JQuery<HTMLElement>) {}

  isChecked(): boolean {
    return this.$element.prop("checked") as boolean;
  }

  setChecked(checked: boolean): void {
    this.$element.prop("checked", checked);
  }

  on(event: string, handler: (event: any) => void): void {
    this.$element.on(event, handler);
  }
}

export class JQueryUIInput implements UIInput {
  constructor(private $element: JQuery<HTMLElement>) {}

  getValue(): string {
    return this.$element.val() as string;
  }

  setValue(value: string): void {
    this.$element.val(value);
  }

  on(event: string, handler: (event: any) => void): void {
    this.$element.on(event, handler);
  }
}

export class JQueryUIDropdown implements UIDropdown {
  constructor(private $element: JQuery<HTMLElement>) {}

  getValue(): string {
    return this.$element.val() as string;
  }

  setValue(value: string): void {
    this.$element.val(value);
  }

  on(event: string, handler: (event: any) => void): void {
    this.$element.on(event, handler);
  }

  getOptions(): string[] {
    return this.$element.find("option").map((_, el) => $(el).val() as string).get();
  }

  setOptions(options: string[]): void {
    this.$element.empty();
    options.forEach(option => {
      this.$element.append(`<option value="${option}">${option}</option>`);
    });
  }
}

export class JQueryUIBanner implements UIBanner {
  constructor(private $element: JQuery<HTMLElement>) {}

  show(): void {
    this.$element.show();
  }

  hide(): void {
    this.$element.hide();
  }

  isVisible(): boolean {
    return this.$element.is(":visible");
  }

  setText(text: string): void {
    this.$element.text(text);
  }

  addClass(className: string): void {
    this.$element.addClass(className);
  }

  removeClass(className: string): void {
    this.$element.removeClass(className);
  }

  on(event: string, handler: (event: any) => void): void {
    this.$element.on(event, handler);
  }
}

export class JQueryUIRow implements UIRow {
  constructor(private $element: JQuery<HTMLElement>) {}

  show(): void {
    this.$element.show();
  }

  hide(): void {
    this.$element.hide();
  }

  toggle(show: boolean): void {
    this.$element.toggle(show);
  }
}

export class JQueryUIComponents implements UIComponents {
  public fretCount: UISelector;
  public showAccidentals: UICheckbox;
  public timeoutSeconds: UIInput;
  public numStrings: UISelector;
  public enableBias: UICheckbox;
  public showScoreNotation: UICheckbox;
  public scoreKey: UISelector;
  public hideQuizNote: UICheckbox;
  public enableTTS: UICheckbox;
  public selectedVoice: UIDropdown;
  public unifiedBanner: UIBanner;
  public scoreKeyRow: UIRow;
  public hideQuizNoteLabel: UIRow;
  public voiceSelection: UIRow;

  constructor() {
    this.fretCount = new JQueryUISelector($("#fret-count"));
    this.showAccidentals = new JQueryUICheckbox($("#accidentals"));
    this.timeoutSeconds = new JQueryUIInput($("#timeout-seconds"));
    this.numStrings = new JQueryUISelector($("#num-strings"));
    this.enableBias = new JQueryUICheckbox($("#enable-bias"));
    this.showScoreNotation = new JQueryUICheckbox($("#show-score-notation"));
    this.scoreKey = new JQueryUISelector($("#score-key"));
    this.hideQuizNote = new JQueryUICheckbox($("#hide-quiz-note"));
    this.enableTTS = new JQueryUICheckbox($("#enable-tts"));
    this.selectedVoice = new JQueryUIDropdown($("#voice-select"));
    this.unifiedBanner = new JQueryUIBanner($("#unified-banner"));
    this.scoreKeyRow = new JQueryUIRow($("#score-key-row"));
    this.hideQuizNoteLabel = new JQueryUIRow($("#hide-quiz-note-label"));
    this.voiceSelection = new JQueryUIRow($("#voice-selection"));
  }
}
