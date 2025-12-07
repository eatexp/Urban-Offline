-> water_start

=== water_start ===
# TITLE: Water Purification
# CATEGORY: Survival Skills
# IMAGE: survival_water.png

Do you have safe drinking water?

* [No, I need to find/treat water]
    -> source_selection
* [Yes, just reading]
    -> overview

=== source_selection ===
**Select Your Source**
Which source is available?

* [Rainwater]
    -> treat_rain
* [Running Water (Stream/River)]
    -> treat_running
* [Standing Water (Pond/Puddle)]
    -> treat_standing
* [None]
    -> finding_water

=== treat_rain ===
**Rainwater**
Safest natural source. Collecting directly in clean container usually requires no treatment. 
If collected from roof/gutter, filter and boil.

* [Start Over]
    -> water_start

=== treat_running ===
**Running Water**
Moderate risk. Steps:
1. **Filter**: Remove particles.
2. **Boil**: Rolling boil for 1 minute.
   OR
   **Chemicals**: Purification tablets (30 mins).

* [Start Over]
    -> water_start

=== treat_standing ===
**Standing Water**
High risk. Avoid if possible.
1. **Filter**: Must filter through cloth/sand/charcoal layers.
2. **Boil**: Rolling boil for 1 minute (Critical).

* [Start Over]
    -> water_start

=== finding_water ===
**Finding Water**
- Follow animal tracks downhill.
- Look for green vegetation lines.
- Dig in dried riverbeds.
- Collect morning dew with cloth.

* [Start Over]
    -> water_start

=== overview ===
**Water Safety Basics**
- **Boiling**: 1 minute rolling boil kills everything.
- **Tablets**: Good backup, follow time limits.
- **Filters**: Remove bacteria but not all viruses (unless purifier).
- **Never drink**: Sea water, urine, or chemically contaminated water.

* [Back]
    -> water_start
