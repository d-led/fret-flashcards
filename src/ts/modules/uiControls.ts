import { UICallbacks, UIState, Settings } from '../types/interfaces';

/**
 * Pure UI Controls Module
 * Handles all DOM manipulation and event binding
 * Follows Single Responsibility Principle - only manages UI interactions
 */
export class UIControls {
  private callbacks: UICallbacks;
  private state: UIState;
  private settings: Settings;

  constructor(callbacks: UICallbacks, initialState: UIState, initialSettings: Settings) {
    this.callbacks = callbacks;
    this.state = initialState;
    this.settings = initialSettings;
  }

  /**
   * Initialize all UI event handlers
   */
  public initializeEventHandlers(): void {
    this.bindQuizControls();
    this.bindFretboardControls();
    this.bindSettingsControls();
    this.bindAudioControls();
    this.bindTTSControls();
    this.bindBannerControls();
  }

  /**
   * Update UI state and re-render affected elements
   */
  public updateState(newState: Partial<UIState>): void {
    this.state = { ...this.state, ...newState };
    this.updateUIFromState();
  }

  /**
   * Update settings and re-render affected elements
   */
  public updateSettings(newSettings: Partial<Settings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.updateUIFromSettings();
  }

  private bindQuizControls(): void {
    // Quiz note button
    $("#quiz-note-btn").on("click", () => {
      this.callbacks.onQuizNoteClick();
    });

    // Skip countdown button
    $("#skip-countdown").on("click", () => {
      this.callbacks.onSkipCountdown();
    });

    // Fret buttons
    $("#fret-buttons").on("click", ".fret-btn", (event) => {
      const $target = $(event.currentTarget);
      const fret = parseInt($target.attr("data-fret") || "0");
      this.callbacks.onFretButtonClick(fret);
    });
  }

  private bindFretboardControls(): void {
    // Fretboard clicks
    $("#fretboard").on("click", ".fret-cell.active-string", (event) => {
      const $target = $(event.currentTarget);
      const stringIndex = parseInt($target.attr("data-string") || "0");
      const fret = parseInt($target.attr("data-fret") || "0");
      this.callbacks.onFretboardClick(stringIndex, fret);
    });

    // Open string note clicks
    $("#fretboard").on("click", ".open-note", (event) => {
      const $target = $(event.currentTarget);
      const stringIndex = parseInt($target.attr("data-string") || "0");
      this.callbacks.onOpenNoteClick(stringIndex);
    });
  }

  private bindSettingsControls(): void {
    // Fret count setting
    $("#fret-count").on("change", (event) => {
      const val = Number((event.target as HTMLSelectElement).value);
      if (val === 11 || val === 21 || val === 22 || val === 24) {
        this.callbacks.onFretCountChange(val);
      }
    });

    // Accidentals setting
    $("#accidentals").on("change", (event) => {
      const show = (event.target as HTMLInputElement).checked;
      this.callbacks.onAccidentalsChange(show);
    });

    // Timeout setting
    $("#timeout").on("change", (event) => {
      const v = parseInt((event.target as HTMLInputElement).value);
      const seconds = isNaN(v) ? 2 : v;
      this.callbacks.onTimeoutChange(seconds);
    });

    // Number of strings setting
    $("#num-strings").on("change", (event) => {
      const count = parseInt((event.target as HTMLSelectElement).value);
      this.callbacks.onNumStringsChange(count);
    });

    // Individual tuning changes
    $("#tuning").on("change", ".tuning-select", (event) => {
      const $target = $(event.currentTarget);
      const stringIndex = $target.data("string");
      const note = (event.target as HTMLSelectElement).value;
      this.callbacks.onTuningChange(stringIndex, note, this.settings.tuning[stringIndex].octave);
    });

    // Octave changes
    $("#tuning").on("change", ".octave-select", (event) => {
      const $target = $(event.currentTarget);
      const stringIndex = $target.data("string");
      const octave = parseInt((event.target as HTMLSelectElement).value);
      this.callbacks.onTuningChange(stringIndex, this.settings.tuning[stringIndex].note, octave);
    });

    // Reset tuning button
    $("#reset-tuning").on("click", () => {
      this.callbacks.onResetTuning();
    });

    // Reset stats button
    $("#reset-stats").on("click", () => {
      this.callbacks.onResetStats();
    });

    // Enable bias setting
    $("#enable-bias").on("change", (event) => {
      const enabled = (event.target as HTMLInputElement).checked;
      this.callbacks.onEnableBiasChange(enabled);
    });

    // Show score notation setting
    $("#show-score-notation").on("change", (event) => {
      const show = (event.target as HTMLInputElement).checked;
      this.callbacks.onShowScoreNotationChange(show);
    });

    // Score key setting
    $("#score-key").on("change", (event) => {
      const key = (event.target as HTMLSelectElement).value;
      this.callbacks.onScoreKeyChange(key);
    });

    // Hide quiz note setting
    $("#hide-quiz-note").on("change", (event) => {
      const hide = (event.target as HTMLInputElement).checked;
      this.callbacks.onHideQuizNoteChange(hide);
    });
  }

  private bindAudioControls(): void {
    // Mic toggle
    $("#mic-toggle").on("click", async () => {
      await this.callbacks.onMicToggle();
    });
  }

  private bindTTSControls(): void {
    // Enable TTS setting
    $("#enable-tts").on("change", (event) => {
      const enabled = (event.target as HTMLInputElement).checked;
      this.callbacks.onEnableTTSChange(enabled);
    });

    // Voice selection
    $("#voice-select").on("change", (event) => {
      const voice = (event.target as HTMLSelectElement).value || null;
      this.callbacks.onVoiceSelectChange(voice);
    });
  }

  private bindBannerControls(): void {
    // Unified banner click
    $("#unified-banner").on("click", () => {
      this.callbacks.onUnifiedBannerClick();
    });
  }

  private updateUIFromState(): void {
    // Update mic button text
    const micButton = $("#mic-toggle");
    if (this.state.pitchDetecting) {
      micButton.text("🎤 Disable Mic");
    } else {
      micButton.text("🎤 Enable Mic");
    }

    // Update countdown display
    if (this.state.countdownValue > 0) {
      $("#countdown").text(this.state.countdownValue.toString());
    } else {
      $("#countdown").text("");
    }

    // Update score notation visibility
    $("#score-key-row").toggle(this.state.showScoreNotation);
    $("#hide-quiz-note-label").toggle(this.state.showScoreNotation);

    // Update voice selection visibility
    this.updateVoiceSelectionVisibility();
  }

  private updateUIFromSettings(): void {
    // Update form values
    $("#fret-count").val(this.settings.fretCountSetting);
    $("#accidentals").prop("checked", this.settings.showAccidentals);
    $("#timeout").val(this.settings.timeoutSeconds);
    $("#num-strings").val(this.settings.numStrings);
    $("#enable-bias").prop("checked", this.settings.enableBias);
    $("#show-score-notation").prop("checked", this.settings.showScoreNotation);
    $("#score-key").val(this.settings.scoreKey);
    $("#hide-quiz-note").prop("checked", this.settings.hideQuizNote);
    $("#enable-tts").prop("checked", this.settings.enableTTS);
    $("#voice-select").val(this.settings.selectedVoice || "");

    // Update tuning UI
    this.updateTuningUI();
  }

  private updateTuningUI(): void {
    const $tuning = $("#tuning");
    $tuning.empty();

    for (let i = 0; i < this.settings.numStrings; i++) {
      const stringTuning = this.settings.tuning[i];
      const stringHtml = `
        <div class="tuning-row">
          <label>String ${i + 1}:</label>
          <select class="tuning-select" data-string="${i}">
            <option value="C" ${stringTuning.note === "C" ? "selected" : ""}>C</option>
            <option value="C#" ${stringTuning.note === "C#" ? "selected" : ""}>C#</option>
            <option value="Db" ${stringTuning.note === "Db" ? "selected" : ""}>Db</option>
            <option value="D" ${stringTuning.note === "D" ? "selected" : ""}>D</option>
            <option value="D#" ${stringTuning.note === "D#" ? "selected" : ""}>D#</option>
            <option value="Eb" ${stringTuning.note === "Eb" ? "selected" : ""}>Eb</option>
            <option value="E" ${stringTuning.note === "E" ? "selected" : ""}>E</option>
            <option value="F" ${stringTuning.note === "F" ? "selected" : ""}>F</option>
            <option value="F#" ${stringTuning.note === "F#" ? "selected" : ""}>F#</option>
            <option value="Gb" ${stringTuning.note === "Gb" ? "selected" : ""}>Gb</option>
            <option value="G" ${stringTuning.note === "G" ? "selected" : ""}>G</option>
            <option value="G#" ${stringTuning.note === "G#" ? "selected" : ""}>G#</option>
            <option value="Ab" ${stringTuning.note === "Ab" ? "selected" : ""}>Ab</option>
            <option value="A" ${stringTuning.note === "A" ? "selected" : ""}>A</option>
            <option value="A#" ${stringTuning.note === "A#" ? "selected" : ""}>A#</option>
            <option value="Bb" ${stringTuning.note === "Bb" ? "selected" : ""}>Bb</option>
            <option value="B" ${stringTuning.note === "B" ? "selected" : ""}>B</option>
          </select>
          <select class="octave-select" data-string="${i}">
            <option value="1" ${stringTuning.octave === 1 ? "selected" : ""}>1</option>
            <option value="2" ${stringTuning.octave === 2 ? "selected" : ""}>2</option>
            <option value="3" ${stringTuning.octave === 3 ? "selected" : ""}>3</option>
            <option value="4" ${stringTuning.octave === 4 ? "selected" : ""}>4</option>
            <option value="5" ${stringTuning.octave === 5 ? "selected" : ""}>5</option>
            <option value="6" ${stringTuning.octave === 6 ? "selected" : ""}>6</option>
            <option value="7" ${stringTuning.octave === 7 ? "selected" : ""}>7</option>
          </select>
        </div>
      `;
      $tuning.append(stringHtml);
    }
  }

  private updateVoiceSelectionVisibility(): void {
    const $voiceSelect = $("#voice-select");
    const $voiceLabel = $("#voice-label");
    
    if (this.state.enableTTS && this.state.ttsInitialized) {
      $voiceSelect.show();
      $voiceLabel.show();
    } else {
      $voiceSelect.hide();
      $voiceLabel.hide();
    }
  }

  /**
   * Show or hide the unified banner
   */
  public toggleUnifiedBanner(show: boolean): void {
    const $banner = $("#unified-banner");
    if (show) {
      $banner.show();
    } else {
      $banner.hide();
    }
  }

  /**
   * Update unified banner based on audio state
   */
  public updateUnifiedBanner(audioEnabled: boolean, isIOS: boolean): void {
    const shouldShow = !audioEnabled && isIOS;
    this.toggleUnifiedBanner(shouldShow);
  }

  /**
   * Update countdown display
   */
  public updateCountdown(value: number): void {
    if (value > 0) {
      $("#countdown").text(value.toString());
    } else {
      $("#countdown").text("");
    }
  }

  /**
   * Clear countdown display
   */
  public clearCountdown(): void {
    $("#countdown").text("");
  }
}
