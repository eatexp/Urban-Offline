VAR solicitor_requested = false
VAR someone_informed = false

-> arrest_start

=== arrest_start ===
# TITLE: Arrest Rights
# CATEGORY: Legal Rights
# IMAGE: legal_arrest.png

Have you just been arrested?

* [Yes, I'm under arrest]
    -> immediate_actions
* [No, just checking my rights]
    -> overview

=== immediate_actions ===
**IMMEDIATE ACTION REQUIRED**
The next 60 seconds are critical.

You have the right to free legal advice.
You have the right to remain silent.

* [What should I say?]
    -> what_to_say

=== what_to_say ===
**SAY EXACTLY THIS:**

1. "I want a **solicitor**."
2. "I want **someone informed** of my arrest."
3. (Give your name and address if asked).
4. **SAY NOTHING ELSE.**

* [They are asking questions]
    -> police_questions
* [They say: "It will be quicker without a solicitor"]
    -> police_tactics

=== police_questions ===
**DO NOT ANSWER QUESTIONS**
Until your solicitor arrives.

The Caution:
"You do not have to say anything. But it may harm your defence if you do not mention when questioned something which you later rely on in court. Anything you do say may be given in evidence."

Translation:
1. You can stay silent.
2. Casual chat IS evidence.
3. Wait for legal advice.

* [I understand]
    -> custody_process

=== police_tactics ===
**IGNORE THIS.**
It is NOT quicker without a solicitor. It is dangerous.
The duty solicitor is FREE, INDEPENDENT, and AVAILABLE 24/7.

**SAY THIS:**
"I want the duty solicitor please."

* [Next]
    -> custody_process

=== custody_process ===
**At the Police Station**
1. You will be searched.
2. Your property will be logged.
3. You will be asked to sign the custody record (You can refuse).
4. You have the right to see the Codes of Practice.

**Time Limits:**
- Standard: 24 hours max.
- Serious crimes: up to 36 or 96 hours (requires authorization).

* [The Interview]
    -> the_interview

=== the_interview ===
**The Interview**
NEVER go into an interview without a solicitor.

**"No Comment"**
You can answer "No comment" to every question.
Your solicitor will advise if you should answer or stay silent.
"No comment" is safer than guessing or lying.

* [After the Interview]
    -> outcomes

=== outcomes ===
**Possible Outcomes**
1. **Released without charge** (Free to go).
2. **Released under investigation** (Wait for news).
3. **Bailed** (Released with conditions).
4. **Charged** (Go to court).

**Summary:**
- Solicitor: YES
- Questions: NO (until advised)
- Casual Chat: NO

* [Start Over]
    -> arrest_start
* [Exit]
    -> END

=== overview ===
**Key Rights Upon Arrest**
- Free Legal Advice (Duty Solicitor).
- Right to have someone informed.
- Right to medical help.
- Right to see the Codes of Practice.
- Right to silence.

**Crucial Warning:**
Casual conversation with officers in the car or cell IS EVIDENCE. Stay silent.

* [Simulate Arrest]
    -> immediate_actions
* [Back]
    -> arrest_start
