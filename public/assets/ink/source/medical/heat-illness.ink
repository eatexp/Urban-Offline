-> heat_start

=== heat_start ===
# TITLE: Heat Stroke vs Heat Exhaustion
# CATEGORY: Environmental Emergencies
# SEVERITY: Critical for Heat Stroke

**Heat-Related Illness**

Heat illness ranges from mild to life-threatening. Quick assessment is critical.

**What symptoms do you observe?**

* [Mild symptoms - tired, sweating]
    -> heat_exhaustion
* [Severe symptoms - no sweating, confusion]
    -> heat_stroke
* [I'm not sure]
    -> assess_symptoms

=== assess_symptoms ===
**Assess Symptoms**

**Key differences:**

**Heat Exhaustion:**
- Heavy sweating
- Cool, moist skin
- Fast, weak pulse
- Nausea, dizziness
- Muscle cramps

**Heat Stroke:**
- NO sweating (dry skin)
- Hot, red skin
- Fast, strong pulse
- Confusion or unconsciousness
- High body temperature (>40°C/104°F)

**Check these symptoms:**

1. **Is the person sweating?**
   * [Yes, sweating heavily]
       -> heat_exhaustion
   * [No, skin is dry]
       -> heat_stroke
   * [Not sure]
       -> check_temperature

2. **Mental state:**
   * [Alert and responsive]
       -> heat_exhaustion
   * [Confused or unconscious]
       -> heat_stroke

3. **Skin temperature:**
   * [Cool and moist]
       -> heat_exhaustion
   * [Hot and dry]
       -> heat_stroke

=== check_temperature ===
**Check Body Temperature**

**If you have a thermometer:**
- Normal: 36-37°C (97-99°F)
- Heat exhaustion: 37-40°C (99-104°F)
- Heat stroke: >40°C (>104°F)

**If no thermometer, feel the skin:**
- Cool/moist = heat exhaustion
- Hot/dry = heat stroke

**What do you observe?**

* [Cool/moist skin]
    -> heat_exhaustion
* [Hot/dry skin]
    -> heat_stroke
* [Can't tell]
    -> treat_as_stroke

=== treat_as_stroke ===
**When in Doubt - Treat as Heat Stroke**

**🚨 HEAT STROKE IS LIFE-THREATENING 🚨**

If you're unsure, treat as heat stroke and call emergency services.

**Better safe than sorry - heat stroke can be fatal within minutes.**

-> heat_stroke

=== heat_exhaustion ===
**Heat Exhaustion**

**Heat exhaustion is serious but treatable if caught early.**

**Symptoms:**
- Heavy sweating
- Cool, pale, moist skin
- Fast, weak pulse
- Nausea or vomiting
- Dizziness or fainting
- Muscle cramps
- Fatigue

**IMMEDIATE TREATMENT:**

1. **Move to cool place:**
   - Shade or air-conditioned area
   - Remove tight clothing

2. **Cool the body:**
   - Cool, wet cloths on head, neck, armpits
   - Fan or air movement
   - Cool (not cold) water to drink

3. **Rehydrate:**
   - Water or sports drink
   - Sip slowly
   - Do NOT give salt tablets

4. **Rest:**
   - Lie down
   - Elevate legs slightly

**Monitor closely - heat exhaustion can progress to heat stroke.**

**Seek medical attention if:**
- Symptoms worsen
- No improvement in 1 hour
- Vomiting prevents drinking
- Person becomes confused

**When to call emergency:**
- Symptoms don't improve
- Person becomes confused
- Loss of consciousness
- Temperature continues rising

-> monitor_progression

=== heat_stroke ===
**🚨 HEAT STROKE - MEDICAL EMERGENCY 🚨**

**CALL EMERGENCY SERVICES IMMEDIATELY**

**Heat stroke is life-threatening and can cause permanent damage or death.**

**Symptoms:**
- NO sweating (dry, hot skin)
- Hot, red skin
- Fast, strong pulse
- High body temperature (>40°C/104°F)
- Confusion, agitation, or unconsciousness
- Seizures possible

**IMMEDIATE ACTIONS (while waiting for help):**

1. **Call emergency services:**
   - "Heat stroke emergency"
   - Location
   - Person's condition

2. **Cool immediately:**
   - Move to shade/cool area
   - Remove clothing
   - Apply cool water to skin
   - Fan or air movement
   - Ice packs to armpits, groin, neck (if available)

3. **Monitor:**
   - Breathing
   - Pulse
   - Consciousness

**Do NOT:**
- Give fluids if unconscious
- Give aspirin or paracetamol (won't help)
- Delay calling for help

**Time is critical - cooling must start immediately!**

-> end_emergency

=== monitor_progression ===
**Monitor for Progression**

**Watch for these warning signs that heat exhaustion is becoming heat stroke:**

- Sweating stops (skin becomes dry)
- Skin becomes hot and red
- Confusion or agitation
- Loss of consciousness
- Seizures
- Temperature rising

**If ANY of these occur:**
- **CALL EMERGENCY SERVICES IMMEDIATELY**
- Treat as heat stroke
- Begin aggressive cooling

**Prevention:**
- Drink plenty of water
- Take breaks in shade
- Wear light, loose clothing
- Avoid peak heat hours (10am-4pm)
- Acclimate gradually to heat

-> end

=== end_emergency ===
**Heat Stroke Emergency**

**🚨 CALL 999/911 🚨**

**Heat stroke requires immediate medical treatment.**

**What to tell emergency services:**
- "Heat stroke"
- Person's condition
- Temperature if known
- How long symptoms present

**Continue cooling until help arrives:**
- Keep applying cool water
- Maintain air movement
- Monitor breathing and pulse
- Be ready for CPR if needed

**Do NOT delay - heat stroke can be fatal!**

Stay with person until help arrives.

-> END

=== end ===
**Heat Illness Summary**

**Remember:**
- Heat exhaustion: sweating, cool skin, treatable
- Heat stroke: no sweating, hot skin, EMERGENCY

**Prevention is key:**
- Stay hydrated
- Take breaks
- Wear appropriate clothing
- Know the signs

**When in doubt, call for help - heat stroke is life-threatening.**

Stay safe.

-> END





