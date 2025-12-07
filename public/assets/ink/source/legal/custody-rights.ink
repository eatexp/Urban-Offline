-> custody_start

=== custody_start ===
# TITLE: Custody Rights
# CATEGORY: Legal Rights
# IMAGE: legal_custody.png

Are you currently being held in a police station?

* [Yes, I'm at the station]
    -> your_welfare
* [No, just checking]
    -> educational_overview

=== your_welfare ===
**Your Welfare Rights**
While in custody, you have statutory rights under PACE Code C.

1. **Rest**: 8 hours continuous rest in 24 hours.
2. **Food**: Clean food and drink at mealtimes.
3. **Medical**: Right to see a doctor/nurse (free).
4. **Toilet**: Access to toilet and washing facilities.
5. **Cell**: Must be clean, warm, litig.

* [Time Limits]
    -> time_limits
* [Reviews]
    -> custody_reviews

=== time_limits ===
**How Long Can They Hold You?**

- **Standard**: Up to 24 hours.
- **Superintendent Extension**: Up to 36 hours (serious crimes).
- **Magistrates Warrant**: Up to 96 hours.

* [Back]
    -> your_welfare

=== custody_reviews ===
**Reviews of Detention**
An inspector (not involved in the case) must review your detention:
1. 6 hours after detention.
2. Every 9 hours after that.
3. You have the right to speak to the review officer.

* [Back]
    -> your_welfare

=== educational_overview ===
**Summary of Custody Rights**
- You must be treated humanely.
- You have the right to legal advice at any time.
- You have the right to have someone informed of your whereabouts.

* [Back]
    -> custody_start
