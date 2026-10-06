# Attribution and provenance

The website preserves the source facts and visual direction from the user's Cypress Realtor Guide export. The original design was adapted from supplied Kimi-generated HTML. The Astro replacement starts from target main `deb667c483a953df80afdc2ba7e18921d350f2c9`, which includes the PR1 triage fixes.

## Photograph

- Original: public/assets/coles-crossing-morning.jpg, copied byte for byte from the export.
- Work: “May Morning” by Michael Martin (pinemikey), May2014.
- Source: https://commons.wikimedia.org/wiki/File:May_Morning_-_Flickr_-_pinemikey.jpg
- License: CC BY-SA2.0, https://creativecommons.org/licenses/by-sa/2.0/
- Responsive660/1320/2640px JPEG derivatives in the same folder are preserved byte for byte. They retain attribution/license; the layout crops them for display.

Preserve attribution and applicable share-alike requirements for adaptations. This image license is not a license for the entire codebase.

## Foundation and content

Site-Bootstrap-ADM `916df29d7410b4a9a5048ed69819b5da448a2ecf` supplies original setup guidance/templates and the reused property-options helper. Its MIT notice is retained in docs/vendor/Site-Bootstrap-ADM-LICENSE.txt. The referenced Lippincott example's project code, identity and providers were not copied into the foundation.

Professional facts/public business contacts remain in src/content/realtors.json and linked source citations. Four individually scoped HAR survey snapshots retain their separate check dates. Sources are public profiles/self-published websites, not independently audited performance records. Company/professional names belong to their owners; paid placement is visibly labeled.

System fonts make no font-service requests and bundle no font binaries. Dependencies retain their package licenses. No overall code/design license was supplied for the inherited design/export, and no new overall grant is invented.
