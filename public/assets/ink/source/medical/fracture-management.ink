-> fracture_start

=== fracture_start ===
# TITLE: Fracture Management and Splinting
# CATEGORY: Trauma
# SEVERITY: Variable

**Fracture Management**

A broken bone (fracture) requires proper immobilization to prevent further injury.

**Signs of a fracture:**
- Severe pain
- Swelling and bruising
- Deformity or abnormal angle
- Inability to move limb
- Bone visible through skin (open fracture)
- Grinding sensation

What type of fracture do you suspect?

* [Open fracture (bone visible)]
    -> open_fracture
* [Closed fracture (no break in skin)]
    -> closed_fracture
* [I'm not sure]
    -> assess_fracture

=== open_fracture ===
**🚨 OPEN FRACTURE - CALL EMERGENCY SERVICES 🚨**

**Open fractures are serious - risk of infection and blood loss.**

**IMMEDIATE ACTIONS:**

1. **Control bleeding:**
   - Apply pressure around (not on) the wound
   - Use clean cloth if available
   - Do NOT push bone back in

2. **Cover the wound:**
   - Use sterile dressing if available
   - Clean cloth if not
   - Do NOT clean the wound deeply

3. **Immobilize:**
   - Do NOT try to straighten the limb
   - Support above and below fracture
   - Keep still

4. **Monitor:**
   - Watch for signs of shock
   - Monitor breathing
   - Check circulation (pulse, color)

**Do NOT:**
- Push bone back into place
- Clean wound deeply
- Move person unnecessarily
- Give food/drink (may need surgery)

-> end_emergency

=== closed_fracture ===
**Closed Fracture**

**IMMEDIATE ACTIONS:**

1. **Immobilize the limb:**
   - Support above and below fracture
   - Do NOT try to straighten
   - Keep in position found

2. **Apply cold:**
   - Ice pack wrapped in cloth
   - 15-20 minutes at a time
   - Reduces swelling

3. **Elevate if possible:**
   - Reduces swelling
   - Improves circulation

**Seek medical attention:**
- All fractures need X-ray and proper treatment
- Go to A&E or call 999 for ambulance

-> splinting_guide

=== assess_fracture ===
**Assess for Fracture**

**Check these signs:**

1. **Pain:** Severe, localized pain?
   * [Yes, severe pain]
       -> pain_severe
   * [No, mild pain]
       -> possible_sprain

2. **Deformity:** Is the limb at an abnormal angle?
   * [Yes, looks deformed]
       -> deformity_present
   * [No, normal shape]
       -> check_movement

3. **Movement:** Can they move the limb?
   * [No, cannot move]
       -> cannot_move
   * [Yes, but painful]
       -> painful_movement

=== pain_severe ===
**Severe Pain Present**

Severe pain suggests possible fracture.

**Next steps:**
1. Immobilize the limb
2. Apply cold compress
3. Seek medical attention

**Treat as fracture until proven otherwise.**

-> splinting_guide

=== deformity_present ===
**Deformity Present**

**🚨 LIKELY FRACTURE - CALL EMERGENCY SERVICES 🚨**

Visible deformity indicates serious fracture.

**Do NOT try to straighten!**

**While waiting:**
1. Immobilize in current position
2. Support above and below
3. Keep person still
4. Monitor for shock

-> end_emergency

=== cannot_move ===
**Cannot Move Limb**

**Likely fracture - immobilize immediately.**

**Actions:**
1. Support limb
2. Immobilize with splint
3. Seek medical attention

-> splinting_guide

=== painful_movement ===
**Painful Movement**

Could be fracture or severe sprain.

**Treat as fracture:**
1. Immobilize
2. Apply cold
3. Seek medical attention

-> splinting_guide

=== possible_sprain ===
**Possible Sprain**

If pain is mild and no deformity, may be sprain.

**Still immobilize and seek medical attention to rule out fracture.**

-> splinting_guide

=== splinting_guide ===
**Splinting Guide**

**Purpose:** Immobilize fracture to prevent further injury.

**Materials needed:**
- Rigid support (board, rolled newspaper, umbrella)
- Padding (clothing, towels)
- Bandages or strips of cloth

**Splinting principles:**

1. **Support joints above and below fracture**
2. **Pad between splint and skin**
3. **Secure firmly but not too tight**
4. **Check circulation after splinting**

**Common fracture locations:**

* [Arm (upper or lower)]
    -> splint_arm
* [Leg (upper or lower)]
    -> splint_leg
* [Finger/Toe]
    -> splint_digit
* [Ribs]
    -> splint_ribs
* [Neck/Spine]
    -> splint_spine

=== splint_arm ===
**Arm Splinting**

**For upper arm:**
1. Support from shoulder to elbow
2. Keep elbow bent at 90 degrees
3. Use sling to support weight
4. Secure to body

**For forearm:**
1. Support from elbow to hand
2. Keep wrist straight
3. Use sling
4. Secure to body

**Improvised sling:**
- Use shirt, scarf, or belt
- Support arm across chest
- Tie around neck and wrist

**Check circulation:**
- Fingers should remain pink
- Person should feel fingers
- If fingers go numb/blue, loosen splint

**Seek medical attention immediately.**

-> end

=== splint_leg ===
**Leg Splinting**

**For upper leg (thigh):**
1. Support from hip to knee
2. Keep leg straight
3. Pad between legs
4. Secure both legs together

**For lower leg:**
1. Support from knee to ankle
2. Keep ankle at 90 degrees
3. Pad well
4. Secure firmly

**Do NOT:**
- Try to straighten if bent
- Move unnecessarily
- Walk on injured leg

**Call emergency services for leg fractures - difficult to transport safely.**

-> end_emergency

=== splint_digit ===
**Finger/Toe Splinting**

**For finger:**
1. Tape to adjacent finger
2. Use small splint if available
3. Keep slightly bent
4. Elevate hand

**For toe:**
1. Tape to adjacent toe
2. Use small splint
3. Keep foot elevated
4. Wear supportive shoe if walking necessary

**Seek medical attention for proper alignment.**

-> end

=== splint_ribs ===
**Rib Fracture**

**Signs:**
- Pain when breathing
- Pain when coughing
- Tenderness to touch

**Treatment:**
1. Support arm on injured side
2. Breathe shallowly
3. Avoid deep breaths
4. Seek medical attention

**🚨 CALL EMERGENCY if:**
- Difficulty breathing
- Coughing blood
- Severe pain

**Rib fractures can puncture lungs - monitor breathing closely.**

-> end_emergency

=== splint_spine ===
**🚨 SUSPECTED SPINE/NECK INJURY 🚨**

**CALL EMERGENCY SERVICES IMMEDIATELY**

**Do NOT move the person unless in immediate danger!**

**Signs:**
- Pain in neck or back
- Numbness or tingling
- Loss of movement
- Difficulty breathing

**While waiting:**
1. Keep person completely still
2. Support head and neck
3. Do NOT move head
4. Monitor breathing

**Moving person with spine injury can cause paralysis!**

-> end_emergency

=== end_emergency ===
**Emergency Fracture**

**🚨 CALL 999/911 🚨**

**What to tell emergency services:**
- Location of fracture
- Open or closed
- Signs of shock
- Other injuries

**While waiting:**
1. Keep person still
2. Monitor breathing
3. Treat for shock
4. Keep warm

**Do NOT:**
- Give food/drink
- Move unnecessarily
- Try to straighten limb

Stay with person until help arrives.

-> END

=== end ===
**Fracture Management Summary**

**Remember:**
- All fractures need medical attention
- Immobilize to prevent further injury
- Monitor for shock
- Check circulation after splinting

**Seek immediate medical attention for:**
- Open fractures
- Leg fractures
- Suspected spine/neck injuries
- Multiple fractures

Stay safe.

-> END





