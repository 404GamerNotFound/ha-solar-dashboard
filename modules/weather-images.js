export const WEATHER_IMAGE_SUFFIXES = Object.freeze({
  sunny: Object.freeze(["sunny"]),
  clear: Object.freeze(["sunny"]),
  "clear-night": Object.freeze(["clear"]),
  partlycloudy: Object.freeze(["cloudy"]),
  cloudy: Object.freeze(["cloudy"]),
  fog: Object.freeze(["cloudy", "fog"]),
  rainy: Object.freeze(["rainy"]),
  pouring: Object.freeze(["rainy"]),
  "lightning-rainy": Object.freeze(["rainy", "thunderstorm"]),
  snowy: Object.freeze(["snowy", "snow", "winter"]),
  snowy_rainy: Object.freeze(["snowy", "snow", "rainy"]),
  "snowy-rainy": Object.freeze(["snowy", "snow", "rainy"]),
  hail: Object.freeze(["hail"]),
  lightning: Object.freeze(["thunderstorm"]),
  windy: Object.freeze(["wind"]),
  windy_variant: Object.freeze(["wind", "cloudy"]),
  "windy-variant": Object.freeze(["wind", "cloudy"]),
});

export function normalizeWeatherState(value) {
  return String(value || "").toLowerCase().trim().replace(/\s+/g, "-");
}

export function weatherSuffixes(state, suffixMap = WEATHER_IMAGE_SUFFIXES) {
  return suffixMap[normalizeWeatherState(state)] || [];
}

export function imageWithSuffix(file, suffix) {
  const value = String(file || "");
  if (!value || !suffix) return "";
  const [, path = value, trail = ""] = value.match(/^([^?#]*)([?#].*)?$/) || [];
  const slashIndex = path.lastIndexOf("/");
  const dotIndex = path.lastIndexOf(".");
  if (dotIndex <= slashIndex) return `${path}_${suffix}${trail}`;
  return `${path.slice(0, dotIndex)}_${suffix}${path.slice(dotIndex)}${trail}`;
}

export function weatherImageFiles({
  variant = {},
  isDaylight = false,
  weatherState = "",
  suffixMap = WEATHER_IMAGE_SUFFIXES,
} = {}) {
  const primaryFile = isDaylight && variant.dayFile ? variant.dayFile : variant.file;
  const fallbackFile = isDaylight ? variant.file : variant.dayFile;
  const weatherFiles = weatherSuffixes(weatherState, suffixMap).flatMap((suffix) => [
    imageWithSuffix(primaryFile, suffix),
    imageWithSuffix(fallbackFile, suffix),
  ]);
  return [
    ...weatherFiles,
    primaryFile,
    ...(fallbackFile && fallbackFile !== primaryFile ? [fallbackFile] : []),
    ...(variant.fallbackFiles || []),
  ].filter(Boolean);
}

export function imagePath(variant, file) {
  if (!file || file.includes("/")) return file;
  return variant?.folder ? `${variant.folder}/${file}` : file;
}

export function webpImageFile(file) {
  return String(file || "").replace(/\.png$/i, ".webp");
}

export function imageFormatFiles(file) {
  if (!/\.png$/i.test(String(file || ""))) return [file].filter(Boolean);
  const webpFile = webpImageFile(file);
  return webpFile && webpFile !== file ? [webpFile, file] : [file];
}

export function customImageFiles({
  image = "",
  dayImage = "",
  isDaylight = false,
  weatherState = "",
  suffixMap = WEATHER_IMAGE_SUFFIXES,
} = {}) {
  const standardFile = String(image || "").trim();
  const daylightFile = String(dayImage || "").trim();
  const primaryFile = isDaylight && daylightFile ? daylightFile : standardFile;
  if (!primaryFile) return [];
  const fallbackFile = isDaylight ? standardFile : daylightFile;
  const weatherFiles = weatherSuffixes(weatherState, suffixMap).flatMap((suffix) => [
    imageWithSuffix(primaryFile, suffix),
    fallbackFile && fallbackFile !== primaryFile ? imageWithSuffix(fallbackFile, suffix) : "",
  ]);
  return [
    ...weatherFiles,
    primaryFile,
    ...(fallbackFile && fallbackFile !== primaryFile ? [fallbackFile] : []),
  ].filter(Boolean);
}

export function customImage({
  image = "",
  dayImage = "",
  isDaylight = false,
  weatherState = "",
  suffixMap = WEATHER_IMAGE_SUFFIXES,
} = {}) {
  const urls = [...new Set(customImageFiles({
    image,
    dayImage,
    isDaylight,
    weatherState,
    suffixMap,
  }))];
  const [primaryUrl, ...fallbackUrls] = urls;
  return {
    src: primaryUrl,
    fallbacks: fallbackUrls,
  };
}

export function variantImage({
  variant = {},
  isDaylight = false,
  weatherState = "",
  localImageUrl,
  remoteImageUrl,
} = {}) {
  const files = weatherImageFiles({ variant, isDaylight, weatherState })
    .map((file) => imagePath(variant, file));
  const urls = [...new Set(files.flatMap((file) => imageFormatFiles(file).flatMap((candidate) => [
    remoteImageUrl?.(candidate),
    localImageUrl?.(candidate),
  ])).filter(Boolean))];
  const [primaryUrl, ...fallbackUrls] = urls;
  return {
    src: primaryUrl,
    fallbacks: fallbackUrls,
  };
}

export function createWeatherImageMethods({
  REPOSITORY_IMAGE_BASE,
  assetUrl,
  WEATHER_IMAGE_SUFFIXES: suffixMap = WEATHER_IMAGE_SUFFIXES,
} = {}) {
  return {
    _weatherState() {
      const entityId = this.config?.weather_entity;
      if (!entityId) return "";
      return normalizeWeatherState(this._hass?.states?.[entityId]?.state);
    },

    _weatherSuffixes() {
      return weatherSuffixes(this._weatherState(), suffixMap);
    },

    _imageStateKey() {
      return `${this._isDaylight()}|${this._weatherState()}|${this.config?.image || ""}|${this.config?.day_image || ""}`;
    },

    _imageWithSuffix(file, suffix) {
      return imageWithSuffix(file, suffix);
    },

    _weatherImageFiles(variant, isDaylight) {
      return weatherImageFiles({
        variant,
        isDaylight,
        weatherState: this._weatherState(),
        suffixMap,
      });
    },

    _imagePath(variant, file) {
      return imagePath(variant, file);
    },

    _imageFormatFiles(file) {
      return imageFormatFiles(file);
    },

    _variantImage(variant) {
      return variantImage({
        variant,
        isDaylight: this._isDaylight(),
        weatherState: this._weatherState(),
        localImageUrl: (file) => this._localImageUrl(file),
        remoteImageUrl: (file) => this._remoteImageUrl(file),
      });
    },

    _customImage() {
      return customImage({
        image: this.config?.image,
        dayImage: this.config?.day_image,
        isDaylight: this._isDaylight(),
        weatherState: this._weatherState(),
        suffixMap,
      });
    },

    _remoteImageUrl(file) {
      return `${REPOSITORY_IMAGE_BASE}/${file}`;
    },

    _localImageUrl(file) {
      try {
        return assetUrl(`images/${file}`);
      } catch (_err) {
        return "";
      }
    },
  };
}
