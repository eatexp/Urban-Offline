VAR gowisely_count = 0
VAR unlawful_search = false

-> start_stop_search

=== start_stop_search ===
# TITLE: Stop & Search (GOWISELY)
# CATEGORY: Legal Rights
# IMAGE: legal_stop.png

Are you being stopped by the police right now?

* [Yes, it's happening now]
    -> real_time_checklist
* [No, just reading up]
    -> educational_overview

=== real_time_checklist ===
**STOP! Read this first.**
The police MUST provide 8 specific pieces of information (GOWISELY) for a search to be lawful. 

You DO NOT have to answer their questions (except name/address).
You DO have to comply with the search (physical resistance = arrest).

* [Start GOWISELY Check]
    -> gowisely_g

=== gowisely_g ===
**G - GROUNDS for suspicion**
Did the officer tell you *specifically* why they suspect you?
(e.g., "We suspect you have drugs because you smell of cannabis" vs "You look suspicious")

* [Yes, specific reason given]
    ~ gowisely_count++
    -> gowisely_o
* [No / Vague reason]
    ~ unlawful_search = true
    -> ask_grounds

= ask_grounds
**SAY THIS:**
"Officer, what are your specific grounds for this search?"

* [They gave a reason]
    -> gowisely_o
* [Still vague / refused]
    -> gowisely_o

=== gowisely_o ===
**O - OBJECT of search**
Did they tell you what they are looking for?
(e.g., drugs, weapons, stolen items)

* [Yes]
    ~ gowisely_count++
    -> gowisely_w
* [No]
    ~ unlawful_search = true
    -> gowisely_w

=== gowisely_w ===
**W - WARRANT card**
If they are NOT in uniform, did they show their warrant card?
(If in uniform, click Yes)

* [Yes / In Uniform]
    ~ gowisely_count++
    -> gowisely_i
* [No (Plain clothes, no card)]
    ~ unlawful_search = true
    **SAY THIS:** "Can I see your warrant card please?"
    -> gowisely_i

=== gowisely_i ===
**I - IDENTITY**
Did they give you their **Name** and **Shoulder (Collar) Number**?

* [Yes]
    ~ gowisely_count++
    -> gowisely_s
* [No]
    ~ unlawful_search = true
    **SAY THIS:** "Can I have your name and shoulder number?"
    -> gowisely_s

=== gowisely_s ===
**S - STATION**
Did they say which police station they are from?

* [Yes]
    ~ gowisely_count++
    -> gowisely_e
* [No]
    ~ unlawful_search = true
    -> gowisely_e

=== gowisely_e ===
**E - ENTITLEMENT**
Did they tell you that you are entitled to a copy of the search record?
(You can get this within 3 months)

* [Yes]
    ~ gowisely_count++
    -> gowisely_l
* [No]
    ~ unlawful_search = true
    -> gowisely_l

=== gowisely_l ===
**L - LEGAL Power**
Did they state the law they are using?
(e.g., "Section 1 PACE", "Section 23 Misuse of Drugs Act", "Section 60")

* [Yes]
    ~ gowisely_count++
    -> gowisely_y
* [No]
    ~ unlawful_search = true
    **SAY THIS:** "Under what legal power are you searching me?"
    -> gowisely_y

=== gowisely_y ===
**Y - YOU are detained**
Did they clearly say "You are detained for the purpose of a search"?

* [Yes]
    ~ gowisely_count++
    -> summary
* [No]
    ~ unlawful_search = true
    **SAY THIS:** "Am I being detained or am I free to go?"
    -> summary

=== summary ===
**GOWISELY CHECK COMPLETE**
Score: {gowisely_count} / 8 requirements met.

{unlawful_search:
    ⚠️ **WARNING: Procedural Errors Detected**
    The police may have failed to follow PACE Code A. 
    1. COMPLY with the search now (do not resist).
    2. NOTE exactly what was missing.
    3. COMPLAIN later.
}

**Your Next Steps:**
1. Ask for the search record (receipt).
2. If nothing found, you are free to go.
3. If arrested, say "I want a solicitor".

* [Start Over]
    -> start_stop_search
* [Exit]
    -> END

=== educational_overview ===
**Your Rights During Stop & Search**

**The Police CAN:**
- Detain you for the search duration.
- Use reasonable force if you resist.
- Ask you to remove outer coat, jacket, and gloves.
- Search your mouth (but not strip search you in public).

**The Police CANNOT:**
- Search you just because of your age, race, or clothing.
- Search you without providing GOWISELY information.

**Critical Scripts:**
- "Am I being detained or am I free to go?"
- "I do not consent, but I will not resist." (If you believe it's unlawful)
- "No comment." (You don't have to answer questions)

* [Run Interactive Checklist]
    -> real_time_checklist
* [Back]
    -> start_stop_search
