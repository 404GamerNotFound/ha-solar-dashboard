# Single Family Home Landscape Variant

## New landscape layout

A new built-in house option, `single_family_home_landscape`, is now available for dashboards that benefit from a wider layout.

The variant uses a 16:9 scene instead of the standard, more compact house composition. It places the main house slightly left of center and moves the solar garden shed to the right, creating more usable space for metric boxes and reducing overlap on wide desktop displays.

## Use it

Select **Single Family Home Landscape** in the card editor, or set the house variant directly:

```yaml
type: custom:ha-solar-dashboard-card
house: single_family_home_landscape
```

## Included assets

The landscape variant has its own image set under `images/single_family_home_landscape/`:

- Separate day and night images
- Weather-specific images for sunny, cloudy, rainy, snowy, thunderstorm, hail, and winter conditions
- PNG and optimized WebP versions for efficient loading

It does not reuse or replace the existing `single_family_home` files. Your current house selection and custom image configuration remain unchanged.

## Layout behavior

The new variant includes its own default positions for the roof PV, shed PV, battery, inverter, wallbox, water meter, grid, smoke overlay, and heat-pump overlay. You can still override every position through the existing `positions` and image-overlay settings.
