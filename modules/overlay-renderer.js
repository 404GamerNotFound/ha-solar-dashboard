export function createOverlayRendererMethods({
  DEFAULT_IMAGE_OVERLAYS,
  IMAGE_OVERLAY_KEYS,
  imageFormatFiles,
  assetUrl,
} = {}) {
  return {
    _overlayDefault(activeHouse, key) {
      return DEFAULT_IMAGE_OVERLAYS[activeHouse]?.[key]
        || DEFAULT_IMAGE_OVERLAYS.single_family_home[key]
        || {};
    },

    _overlayConfig(activeHouse, key) {
      return {
        ...this._overlayDefault(activeHouse, key),
        ...(this.config.image_overlays?.[key] || {}),
      };
    },

    _overlayNumber(value, fallback, min, max) {
      return this._clampNumber(value, fallback, min, max);
    },

    _overlayAssetUrls(key) {
      const file = `${key}.png`;
      const urls = imageFormatFiles(file).flatMap((candidate) => {
        const candidates = [this._remoteImageUrl(candidate)];
        try {
          candidates.push(assetUrl(candidate));
        } catch (_err) {
          // Local root fallback is optional in HACS.
        }
        try {
          candidates.push(assetUrl(`images/${candidate}`));
        } catch (_err) {
          // Local images fallback is optional in HACS.
        }
        return candidates;
      });
      return [...new Set(urls.filter(Boolean))];
    },

    _renderImageOverlays(activeHouse) {
      return IMAGE_OVERLAY_KEYS.map((key) => {
        const config = this._overlayConfig(activeHouse, key);
        if (config.enabled !== true) return "";
        const left = this._overlayNumber(config.left, this._overlayDefault(activeHouse, key).left ?? 50, 0, 100);
        const top = this._overlayNumber(config.top, this._overlayDefault(activeHouse, key).top ?? 50, 0, 100);
        const width = this._overlayNumber(config.width ?? config.size, this._overlayDefault(activeHouse, key).width ?? 12, 2, 60);
        const orientation = String(config.orientation || "right").toLowerCase() === "left" ? "left" : "right";
        const label = this._overlayLabel(key);
        const scaleX = key === "heatpump" && orientation === "left" ? -1 : 1;
        const translateY = key === "smoke" ? "-100%" : "-50%";
        const style = [
          `left:${left}%`,
          `top:${top}%`,
          `width:${width}%`,
          `--overlay-scale-x:${scaleX}`,
          `--overlay-translate-y:${translateY}`,
        ].join(";");
        const [src, ...fallbacks] = this._overlayAssetUrls(key);
        const reading = this._formatOverlayReading(key);
        const visibilityKey = `overlay_${key}`;
        const readingHtml = this.config.image_overlays?.[key]?.entity && this._labelVisibility(visibilityKey).image
          ? `<div class="overlay-reading${this._labelVisibilityClass(visibilityKey, "image")}"><span class="overlay-reading-label" data-overlay-label="${this._escape(key)}">${this._escape(label)}</span><span class="overlay-reading-value" data-overlay-value="${this._escape(key)}">${this._escape(reading)}</span></div>`
          : "";
        return `
          <div class="image-overlay-wrap image-overlay-wrap-${this._escape(key)}" style="${this._escape(style)}">
            <img class="image-overlay image-overlay-${this._escape(key)}" src="${this._escape(src)}" data-fallbacks="${this._escape(fallbacks.join("|"))}" alt="${this._escape(label)}" loading="lazy" />
            ${readingHtml}
          </div>
        `;
      }).join("");
    },
  };
}
