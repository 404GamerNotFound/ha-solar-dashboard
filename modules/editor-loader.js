export function createLazyEditorElementClass({
  editorPanelType,
  editorBundleUrl,
  loadingText = "Loading HA Solar Dashboard editor...",
  failedText = "Could not load the HA Solar Dashboard editor.",
} = {}) {
  let loadPromise;

  function loadEditorBundle() {
    if (globalThis.customElements?.get(editorPanelType)) {
      return globalThis.customElements.whenDefined(editorPanelType);
    }
    if (!loadPromise) {
      loadPromise = import(editorBundleUrl()).then(() => globalThis.customElements.whenDefined(editorPanelType));
    }
    return loadPromise;
  }

  return class HaSolarDashboardLazyEditor extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
      this._renderLoading();
      this._ensureEditor();
    }

    setConfig(config) {
      this.config = config;
      this._config = config;
      if (this._editorElement?.setConfig) {
        this._editorElement.setConfig(config);
        return;
      }
      this._ensureEditor();
    }

    set hass(hass) {
      this._hass = hass;
      if (this._editorElement) this._editorElement.hass = hass;
    }

    get hass() {
      return this._hass;
    }

    _renderLoading() {
      if (this._editorElement || this.shadowRoot.querySelector("[data-editor-loader]")) return;
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
          }
          [data-editor-loader] {
            border: 1px solid var(--divider-color, rgba(148, 163, 184, 0.28));
            border-radius: 8px;
            color: var(--primary-text-color, #e5e7eb);
            font: 14px/1.4 system-ui, sans-serif;
            padding: 16px;
          }
        </style>
        <div data-editor-loader>${loadingText}</div>
      `;
    }

    _renderError(error) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
          }
          [data-editor-loader-error] {
            border: 1px solid var(--error-color, #ef4444);
            border-radius: 8px;
            color: var(--error-color, #ef4444);
            font: 14px/1.4 system-ui, sans-serif;
            padding: 16px;
          }
          small {
            display: block;
            margin-top: 6px;
            opacity: 0.72;
            word-break: break-word;
          }
        </style>
        <div data-editor-loader-error>${failedText}<small>${String(error?.message || error || "")}</small></div>
      `;
    }

    _ensureEditor() {
      if (this._editorElement || this._loadingEditor) return;
      this._loadingEditor = true;
      loadEditorBundle()
        .then(() => {
          this._loadingEditor = false;
          this._mountEditor();
        })
        .catch((error) => {
          this._loadingEditor = false;
          console.warn("HA Solar Dashboard: could not load editor bundle", error);
          this._renderError(error);
        });
    }

    _mountEditor() {
      if (this._editorElement) return;
      const editor = globalThis.document.createElement(editorPanelType);
      this.shadowRoot.replaceChildren(editor);
      this._editorElement = editor;
      if (this._config !== undefined && typeof editor.setConfig === "function") editor.setConfig(this._config);
      if (this._hass !== undefined) editor.hass = this._hass;
    }
  };
}
