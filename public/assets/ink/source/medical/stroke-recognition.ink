-> stroke_start

=== stroke_start ===
# TITLE: Stroke Recognition (FAST Protocol)
# CATEGORY: Medical Emergencies
# SEVERITY: Critical

**Stroke Recognition - FAST Protocol**

A stroke is a medical emergency. Time is critical - every minute counts.

Do you suspect someone is having a stroke?

* [Yes, check FAST symptoms]
    -> fast_check
* [No, just reading]
    -> overview
* [I'm not sure]
    -> fast_check

=== fast_check ===
**FAST Assessment**

Check these symptoms using the FAST protocol:

**F - Face:** Ask them to smile. Does one side of the face droop?

* [Yes, face drooping]
    -> face_droop
* [No, face normal]
    -> arms_check

=== face_droop ===
**Face Drooping Detected**

This is a sign of stroke. Continue checking other symptoms.

**A - Arms:** Ask them to raise both arms. Does one arm drift downward?

* [Yes, arm drifts]
    -> arms_drift
* [No, arms normal]
    -> speech_check

=== arms_check ===
**A - Arms:** Ask them to raise both arms. Does one arm drift downward?

* [Yes, arm drifts]
    -> arms_drift
* [No, arms normal]
    -> speech_check

=== arms_drift ===
**Arm Weakness Detected**

This is a sign of stroke. Continue checking.

**S - Speech:** Ask them to repeat a simple phrase. Is speech slurred or strange?

* [Yes, speech abnormal]
    -> speech_abnormal
* [No, speech normal]
    -> time_check

=== speech_check ===
**S - Speech:** Ask them to repeat a simple phrase. Is speech slurred or strange?

* [Yes, speech abnormal]
    -> speech_abnormal
* [No, speech normal]
    -> time_check

=== speech_abnormal ===
**Speech Problems Detected**

This is a sign of stroke.

**T - Time:** If you notice ANY of these symptoms, call emergency services immediately.

-> call_emergency

=== time_check ===
**T - Time Check**

Even if only ONE symptom is present, this could be a stroke.

**Additional symptoms to check:**
- Sudden severe headache
- Sudden vision problems
- Sudden dizziness or loss of balance
- Sudden confusion

Do they have any of these additional symptoms?

* [Yes, additional symptoms]
    -> call_emergency
* [No, only checked FAST]
    -> possible_stroke

=== possible_stroke ===
**Possible Stroke Detected**

If ANY FAST symptom is present, treat this as a stroke emergency.

**IMMEDIATE ACTIONS:**

1. **Call emergency services NOW** (999 in UK, 911 in US)
2. Note the time symptoms started (critical for treatment)
3. Keep the person calm and still
4. Do NOT give them food, drink, or medication
5. If they become unconscious, place in recovery position
6. Monitor breathing and be ready for CPR if needed

**Why time matters:**
- Stroke treatment is most effective within 3-4 hours
- Clot-busting drugs can only be given in early window
- Every minute of delay increases brain damage

-> end

=== call_emergency ===
**🚨 EMERGENCY - CALL 999/911 NOW 🚨**

**This is a STROKE EMERGENCY**

**What to tell emergency services:**
- "I think someone is having a stroke"
- Location (exact address if possible)
- Age and gender of person
- Time symptoms started
- FAST symptoms observed

**While waiting for help:**

1. Keep person calm and still
2. Do NOT give food, drink, or medication
3. Loosen tight clothing
4. If unconscious, place in recovery position
5. Monitor breathing - be ready for CPR

**Do NOT:**
- Drive them to hospital yourself (ambulance is faster)
- Give aspirin (could make bleeding stroke worse)
- Leave them alone

**Time is brain - every minute counts!**

-> end

=== overview ===
**Stroke Overview**

A stroke occurs when blood supply to the brain is interrupted, causing brain cells to die.

**Two main types:**
1. **Ischemic stroke** (85%) - blocked artery
2. **Hemorrhagic stroke** (15%) - bleeding in brain

**FAST Protocol:**
- **F**ace drooping
- **A**rm weakness
- **S**peech problems
- **T**ime to call emergency

**Risk factors:**
- High blood pressure
- Diabetes
- Smoking
- Age (risk increases with age)
- Family history

**Prevention:**
- Control blood pressure
- Manage diabetes
- Exercise regularly
- Healthy diet
- Don't smoke

-> end

=== end ===
**Remember:** If you suspect a stroke, call emergency services immediately. Time is critical.

Stay safe.

-> END





