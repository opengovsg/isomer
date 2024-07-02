# 5. JSONForms form builder

Date: 2024-06-28

## Status

Accepted

## Context

We need to build a headless CMS that is able to automatically conform to a set schema.

## Decision

1. We will use JSON Schema to define the public interface of the Isomer Next Components and the structure of a page schema that makes up a single page in Isomer Next.
2. We will use JSONForms to automatically generate a form-based editor using the definitions made in the JSON Schema.
    1. Also, we will leverage on the JSONForms library rather than hand-rolling our own components to build the form-based editor using the JSON Schema. [More information is available in this PR](https://github.com/opengovsg/isomer/pull/227).
3. We will develop Isomer Studio independently from the JSON Schema or Isomer Next Components.

## Consequences

Both Isomer Next and Isomer Studio will have their own objectives to fulfill:

1. Isomer Studio will be focused on allowing site editors to be able to edit and publish their websites easily, and to cater to the needs of the site editors and their agencies only.
2. Isomer Next Components will be focused on delivering gold standard websites, to cater to the complex needs of the public to find the information that they need easily.

When developing a new component, there should be no need to made any changes to Isomer Studio. An update to the Isomer Next Components package, as well as the JSON Schema, should be sufficient to allow site editors to make use of the new component.

Additionally, the JSONForms form builder should be generic enough to handle new fields added to the JSON Schema, while being able to meet the design requirements.
