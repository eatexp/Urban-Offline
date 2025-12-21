-> breathing_start

=== breathing_start ===
# TITLE: Breathing Difficulties
# CATEGORY: Medical Emergencies
# SEVERITY: Critical

**Breathing Difficulties Assessment**

Difficulty breathing is a medical emergency. Quick assessment is critical.

**Is the person:**

* [Completely unable to breathe (choking)]
    -> choking_emergency
* [Struggling to breathe]
    -> assess_breathing
* [Breathing but wheezing/gasping]
    -> wheezing
* [I'm not sure]
    -> assess_breathing

=== choking_emergency ===
**🚨 CHOKING EMERGENCY 🚨**

**Person cannot speak, cough, or breathe - IMMEDIATE ACTION REQUIRED**

**For conscious adult/child over 1 year:**

1. **Encourage coughing:**
   - If they can cough, encourage it
   - Do NOT slap back if coughing

2. **If cannot cough - 5 back blows:**
   - Stand behind person
   - Lean them forward
   - Hit firmly between shoulder blades with heel of hand
   - Check mouth after each blow

3. **If unsuccessful - 5 abdominal thrusts (Heimlich):**
   - Stand behind person
   - Make fist above navel
   - Grasp fist with other hand
   - Pull sharply inward and upward
   - Check mouth after each thrust

4. **Repeat cycle:**
   - 5 back blows
   - 5 abdominal thrusts
   - Continue until object dislodged or person unconscious

**If person becomes unconscious:**
- Call emergency services
- Begin CPR
- Check mouth before each rescue breath

-> end_emergency

=== assess_breathing ===
**Assess Breathing**

**Check these signs:**

1. **Breathing rate:**
   - Normal: 12-20 breaths/minute
   - Fast: >20 breaths/minute
   - Slow: <12 breaths/minute

2. **Breathing effort:**
   - Using neck muscles?
   - Flaring nostrils?
   - Gasping?
   - Can they speak full sentences?

3. **Color:**
   - Blue lips or fingernails?
   - Pale or gray skin?

**What do you observe?**

* [Blue lips/skin, severe distress]
    -> severe_distress
* [Fast breathing, struggling]
    -> moderate_distress
* [Wheezing or whistling sound]
    -> wheezing
* [Chest pain with breathing]
    -> chest_pain

=== severe_distress ===
**🚨 SEVERE BREATHING DISTRESS 🚨**

**CALL EMERGENCY SERVICES IMMEDIATELY**

**Signs of severe distress:**
- Blue lips or fingernails (cyanosis)
- Cannot speak
- Gasping for air
- Confusion or drowsiness
- Extreme effort to breathe

**While waiting for help:**

1. **Position:**
   - Sit upright (best for breathing)
   - Lean slightly forward
   - Support with arms on table/knees

2. **Loosen clothing:**
   - Around neck and chest

3. **Stay calm:**
   - Panic worsens breathing
   - Speak calmly and reassuringly

4. **Monitor:**
   - Watch for loss of consciousness
   - Be ready for CPR

**Do NOT:**
- Lay person flat
- Give food or drink
- Leave them alone

-> end_emergency

=== moderate_distress ===
**Moderate Breathing Distress**

**This requires medical attention.**

**Common causes:**
- Asthma attack
- Allergic reaction
- Infection (pneumonia)
- Anxiety/panic attack

**Immediate actions:**

1. **Position:**
   - Sit upright
   - Lean forward slightly
   - Support arms

2. **Calm environment:**
   - Fresh air if possible
   - Remove triggers (smoke, allergens)

3. **Known conditions:**
   - Use prescribed inhaler if asthma
   - Use EpiPen if anaphylaxis suspected

**Call emergency if:**
- Getting worse
- Medication not helping
- Lips turning blue
- Confusion or drowsiness

-> specific_causes

=== wheezing ===
**Wheezing (Whistling Sound)**

**Wheezing indicates narrowed airways.**

**Common causes:**
- Asthma
- Allergic reaction
- Infection
- Foreign object

**Questions to determine cause:**

1. **Known asthma?**
   * [Yes, has asthma]
       -> asthma_attack
   * [No asthma history]
       -> check_allergy

2. **Recent exposure to allergen?**
   * [Yes, possible allergy]
       -> allergic_reaction
   * [No known exposure]
       -> infection_possible

=== asthma_attack ===
**Asthma Attack**

**Immediate actions:**

1. **Use rescue inhaler:**
   - Usually blue inhaler (salbutamol/albuterol)
   - 1-2 puffs every 2 minutes (max 10 puffs)
   - Use spacer if available

2. **Position:**
   - Sit upright
   - Lean slightly forward
   - Stay calm

3. **Breathing technique:**
   - Breathe slowly and deeply
   - In through nose, out through mouth

**Call emergency if:**
- No improvement after 10 puffs
- Cannot speak full sentences
- Lips turning blue
- Extreme distress

**Severe asthma attack signs:**
- Cannot speak
- Blue lips
- Exhaustion
- Confusion

-> end_emergency

=== allergic_reaction ===
**Possible Allergic Reaction**

**Check for anaphylaxis signs:**
- Swelling (face, lips, tongue)
- Hives or rash
- Difficulty swallowing
- Dizziness or fainting

**If anaphylaxis suspected:**

**🚨 USE EPIPEN IF AVAILABLE 🚨**

1. **EpiPen administration:**
   - Remove from case
   - Hold firmly against outer thigh
   - Press until click heard
   - Hold for 3 seconds
   - Massage injection site

2. **Call emergency services:**
   - "Anaphylaxis emergency"
   - State EpiPen used

3. **Position:**
   - Lie flat (unless vomiting)
   - Elevate legs

**Even if EpiPen used, emergency care is required.**

-> end_emergency

=== infection_possible ===
**Possible Respiratory Infection**

**Signs of infection:**
- Fever
- Cough
- Colored mucus
- Chest pain

**Seek medical attention:**
- Doctor or urgent care
- Emergency if severe distress

**While waiting:**
- Rest
- Fluids
- Upright position
- Monitor breathing

-> end

=== chest_pain ===
**Chest Pain with Breathing**

**Possible causes:**
- Pneumonia
- Pulmonary embolism (blood clot)
- Pneumothorax (collapsed lung)
- Heart attack

**🚨 CALL EMERGENCY SERVICES 🚨**

**Especially if:**
- Sudden severe pain
- Shortness of breath
- Coughing blood
- History of blood clots
- Recent surgery or long travel

**While waiting:**
- Sit upright
- Stay calm
- Do NOT exert
- Monitor breathing

-> end_emergency

=== specific_causes ===
**Specific Breathing Problems**

**Different conditions require different approaches:**

* [Asthma attack]
    -> asthma_attack
* [Allergic reaction/anaphylaxis]
    -> allergic_reaction
* [Hyperventilation/panic attack]
    -> hyperventilation
* [Pneumonia/infection]
    -> infection_possible

=== hyperventilation ===
**Hyperventilation / Panic Attack**

**Signs:**
- Very fast breathing
- Tingling in hands/face
- Dizziness
- Chest tightness
- Anxiety/panic

**Treatment:**

1. **Calm reassurance:**
   - "You're safe"
   - "This will pass"
   - "Focus on your breathing"

2. **Breathing technique:**
   - Breathe in slowly (count 1-2-3-4)
   - Hold (count 1-2)
   - Breathe out slowly (count 1-2-3-4-5-6)
   - Repeat

3. **Do NOT use paper bag:**
   - Old advice, now discouraged
   - Can be dangerous

4. **Distraction:**
   - Count backwards from 100
   - Name 5 things you can see
   - Focus on grounding

**Usually improves in 10-20 minutes.**

**Seek medical help if:**
- First time experiencing
- Not improving
- Chest pain
- Any doubt it's panic attack

-> end

=== end_emergency ===
**Breathing Emergency**

**🚨 CALL 999/911 🚨**

**What to tell emergency services:**
- "Breathing emergency"
- Person's condition
- Known medical conditions
- Medications taken

**While waiting:**
- Keep person upright
- Monitor breathing
- Be ready for CPR if stops breathing
- Stay calm and reassuring

**Do NOT:**
- Lay person flat
- Give food/drink
- Leave alone

Stay with person until help arrives.

-> END

=== end ===
**Breathing Difficulties Summary**

**Remember:**
- Severe breathing problems are emergencies
- Position upright for best breathing
- Use prescribed medications (inhaler, EpiPen)
- Call for help if worsening or not improving

**Emergency signs:**
- Blue lips/skin
- Cannot speak
- Extreme distress
- Confusion
- Loss of consciousness

**When in doubt, call emergency services.**

Stay safe.

-> END




