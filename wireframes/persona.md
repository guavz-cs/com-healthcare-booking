# User Persona: Aisha Mbeki

**Project:** Community Healthcare Clinic — Accessible Healthcare Booking Portal

**Persona type:** Primary assistive-technology user

**Age:** 34

**Occupation:** Administrative officer

**Location:** Gqeberha, Eastern Cape, South Africa

## Background

Aisha is a blind adult who uses assistive technology to access digital services independently. She is comfortable using computers and online services but encounters healthcare websites that rely on visual cues, poorly labelled controls, inaccessible appointment calendars and validation messages that are not announced by her screen reader.

She wants to access public healthcare services without needing another person to interpret the interface or complete online tasks on her behalf.

## Technical Configuration

* Operating system: Windows 11
* Browser: Mozilla Firefox
* Screen reader: NVDA
* Input method: Keyboard only
* Navigation keys: Tab, Shift+Tab, Enter, Space and arrow keys

## Goals

1. Find appropriate healthcare services through an accessible directory.
2. Search and filter services using keyboard-operable controls.
3. Review practitioner availability and select an appointment.
4. Complete booking forms independently and securely.
5. Understand validation errors and receive accessible booking confirmation.

## Pain Points

* Interactive icons without meaningful accessible names.
* Appointment calendars that cannot be operated with a keyboard.
* Form labels and instructions that are missing or unclear.
* Validation messages that are only visually displayed.
* Availability changes that are not announced to screen readers.
* Inconsistent keyboard focus and inaccurate ARIA states.

## Accessibility Needs

The portal must use semantic HTML, associated form labels, descriptive instructions, accessible validation, appropriate live regions and synchronised ARIA states. All functionality must be available through keyboard navigation, with visible focus indicators, logical focus management and compliant colour contrast.

Appointment availability and booking outcomes must be communicated clearly without relying on colour or visual presentation alone.

## Success Criteria

Aisha can independently find a healthcare service, filter the directory, select an available appointment, complete the booking form, correct validation errors and receive confirmation using NVDA and a keyboard alone.

## Design Principle

Healthcare access must not depend on a user's ability to see the screen or operate a mouse. Accessibility, privacy, clarity and user independence are foundational requirements of the application.
