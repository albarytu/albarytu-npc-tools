# Albarytu NPC Tools

A Foundry VTT module for transforming disposable NPC tokens into persistent story characters.

The module focuses on two common Game Master workflows:

- Giving generic NPCs meaningful randomized names when they enter the scene.
- Promoting an important NPC token into a permanent Actor without losing its current state.

Originally developed for PF2E and SF2E campaigns, but designed to be system-agnostic and driven by RollTables rather than hardcoded content.

---

# Features

## Promote Token to Actor

Unlinked NPC tokens can be promoted into unique persistent Actors directly from the Token HUD.

When promoted:

- A new Actor is created from the token's actor current state.
- Current HP, effects, conditions, and modifications are preserved.
- The token is now linked to the new Actor.
- The new Actor's prototype token is updated to:
  - use the token's actor name
  - use linked actor data
  - display names on owner hover (when previously disabled)

This workflow allows a disposable NPC to become a permanent story character with a single click.

Example:

Goblin Warrior
↓ Drop into scene

token becomes Gargle (Goblin Warrior)
↓ when it becomes important, use the Promote action

new Actor gets created for Gargle (Goblin Warrior)
--- 

## Hierarchical Table-based Naming

When a token is created for a non-unique, the module can automatically generate a name using RollTables.
Names are generated only when:
- the token is unlinked
- the token and its actor name are the same
- an appropriate RollTable can be found
That way, manually renamed tokens are not modified.

RollTable-Based Naming Names are generated from standard Foundry RollTables.
Names are formed with three segments: title + first + last.

The module will search for one table for each of these naming components based on the actor, in a hierarchical way (top ones get preference over the bottom). We make the assumption that spoken languages have something to do with a character's culture:

- actor name (e.g. "aeon guard trooper::title" contains titles or ranks for Aeon Guard Trooper characters)
- ancestry/traits + language (e.g. "human-azlanti::last" contains last names for Human characters that speak Azlanti)
- ancestry/traits only (e.g. "human::first" for generic human first names)

The module automatically discovers and uses tables under the "albarytu-npc-names" folder. No configuration is required.

---

# Design Goals
- System agnostic
- Data driven
- RollTable based
- No hardcoded ancestries
- No hardcoded naming conventions
- World content takes precedence over module content
- Support both generic NPCs and story-important characters

---

# Future Ideas Possible future enhancements:
- Name reroll HUD button
- Name uniqueness protection
- Batch name generation
- Alternate name formats
- Compendium-backed naming packs
- Additional NPC management tools

# Companion Content Packs

This module contains functionality only.

System-specific RollTables can be distributed separately, for example:

- Albarytu NPC SF2E Tables
- Albarytu NPC PF2E Tables

This keeps naming data independent from the module code while allowing custom naming packs to be developed and maintained separately.