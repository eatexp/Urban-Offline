-> burns_start

=== burns_start ===
# TITLE: Burns Assessment and First Aid
# CATEGORY: Trauma
# SEVERITY: Variable

**Burns Assessment**

Burns can be life-threatening. Assess severity immediately.

What type of burn is this?

* [Thermal (fire, hot liquid, steam)]
    -> thermal_burn
* [Chemical burn]
    -> chemical_burn
* [Electrical burn]
    -> electrical_burn
* [I'm not sure]
    -> assess_severity

=== thermal_burn ===
**Thermal Burn**

**IMMEDIATE ACTION:**
1. Remove person from heat source
2. Stop the burning process
3. Remove clothing/jewelry (if not stuck to skin)
4. Cool the burn with cool (not cold) running water for 10-20 minutes

**Do NOT:**
- Use ice (can cause more damage)
- Break blisters
- Apply creams or ointments
- Remove clothing stuck to burn

Now assess the severity.

-> assess_severity

=== chemical_burn ===
**Chemical Burn**

**IMMEDIATE ACTION:**
1. Remove contaminated clothing
2. Brush off dry chemicals (wear gloves if possible)
3. Flush with cool running water for at least 20 minutes
4. Continue flushing while waiting for help

**For eyes:**
- Hold eye open
- Flush from inner corner outward
- Continue for 20+ minutes

**Do NOT:**
- Neutralize with other chemicals
- Delay flushing

Now assess severity.

-> assess_severity

=== electrical_burn ===
**Electrical Burn**

**DANGER - Do NOT touch person if still in contact with electricity!**

**IMMEDIATE ACTION:**
1. Turn off power source if safe
2. Use non-conductive object to move person away
3. Check for breathing and pulse
4. Call emergency services immediately

**Electrical burns can cause:**
- Internal injuries (not visible)
- Cardiac arrest
- Muscle damage

**Always seek medical attention for electrical burns.**

-> call_emergency_electrical

=== assess_severity ===
**Assess Burn Severity**

**First Degree (Superficial):**
- Red, dry skin
- Painful
- No blisters
- Affects only outer layer

**Second Degree (Partial Thickness):**
- Red, blistered skin
- Very painful
- Swelling
- Affects deeper layers

**Third Degree (Full Thickness):**
- White, charred, or leathery skin
- May be painless (nerve damage)
- No blisters
- Affects all skin layers

What severity do you observe?

* [First degree - minor]
    -> first_degree
* [Second degree - moderate]
    -> second_degree
* [Third degree - severe]
    -> third_degree
* [I'm not sure]
    -> size_check

=== size_check ===
**Check Burn Size**

Use the person's palm (including fingers) = approximately 1% of body surface area.

**How much of the body is burned?**

* [Less than palm size]
    -> small_burn
* [1-2 palm sizes]
    -> medium_burn
* [More than 2 palm sizes]
    -> large_burn
* [Face, hands, feet, genitals]
    -> critical_areas

=== small_burn ===
**Small Burn (<1% body surface)**

If first or second degree, this can usually be treated at home.

**Treatment:**
1. Cool with water (10-20 minutes)
2. Cover with sterile non-stick dressing
3. Take pain relief (paracetamol/ibuprofen)
4. Watch for signs of infection

**Seek medical help if:**
- Burn doesn't heal in 2 weeks
- Signs of infection (redness, pus, fever)
- Pain worsens

-> end

=== medium_burn ===
**Medium Burn (1-2% body surface)**

**Seek medical attention** for proper assessment and treatment.

**While waiting:**
1. Keep burn cool and covered
2. Elevate burned area if possible
3. Give pain relief
4. Monitor for shock

**Call emergency if:**
- Person is child or elderly
- Burn is on face, hands, feet, or genitals
- Signs of infection appear

-> end

=== large_burn ===
**Large Burn (>2% body surface)**

**🚨 CALL EMERGENCY SERVICES 🚨**

This is a serious burn requiring immediate medical care.

**While waiting:**
1. Keep person calm and still
2. Cover burn with clean, dry cloth (not fluffy material)
3. Elevate burned area
4. Monitor breathing and pulse
5. Treat for shock (lay flat, keep warm)

**Do NOT:**
- Remove clothing stuck to burn
- Apply creams or ice
- Give food or drink if going to surgery

-> end

=== critical_areas ===
**Burns to Critical Areas**

**🚨 CALL EMERGENCY SERVICES 🚨**

Burns to face, hands, feet, or genitals are serious regardless of size.

**Special concerns:**
- **Face:** Risk of airway burns, breathing problems
- **Hands:** Functional impairment
- **Feet:** Mobility issues
- **Genitals:** Infection risk

**While waiting:**
1. Keep area clean and covered
2. Monitor breathing (especially face burns)
3. Do NOT apply pressure
4. Keep person calm

-> end

=== first_degree ===
**First Degree Burn**

**Treatment:**
1. Cool with water (10-20 minutes)
2. Apply aloe vera or burn cream (optional)
3. Cover with sterile dressing
4. Take pain relief if needed

**Usually heals in 3-7 days.**

**Seek medical help if:**
- No improvement after 2 weeks
- Signs of infection
- Burn covers large area

-> end

=== second_degree ===
**Second Degree Burn**

**Treatment:**
1. Cool with water (10-20 minutes)
2. Cover with sterile non-stick dressing
3. Change dressing daily
4. Take pain relief
5. Watch for infection

**Usually heals in 2-3 weeks.**

**Seek medical help if:**
- Burn is large (>2% body surface)
- On face, hands, feet, or genitals
- Signs of infection
- Doesn't heal in 3 weeks

-> end

=== third_degree ===
**Third Degree Burn**

**🚨 CALL EMERGENCY SERVICES IMMEDIATELY 🚨**

This is a severe, life-threatening burn.

**Characteristics:**
- White, charred, or leathery appearance
- May be painless (nerves destroyed)
- No blisters
- Requires skin grafting

**While waiting:**
1. Do NOT remove clothing stuck to burn
2. Cover with clean, dry cloth
3. Elevate burned area
4. Monitor breathing and pulse
5. Treat for shock

**Do NOT:**
- Apply creams or ice
- Break blisters
- Give food/drink (may need surgery)

-> end

=== call_emergency_electrical ===
**🚨 CALL EMERGENCY SERVICES 🚨**

**Electrical burns always require medical attention.**

**What to tell emergency services:**
- "Electrical burn"
- Voltage if known
- Duration of contact
- Current symptoms

**While waiting:**
1. Monitor breathing and pulse
2. Be ready for CPR if needed
3. Keep person still
4. Cover visible burns with clean cloth

**Do NOT touch person if still in contact with electricity!**

-> end

=== end ===
**Remember:** When in doubt, seek medical attention. Burns can become infected and cause serious complications.

Stay safe.

-> END





