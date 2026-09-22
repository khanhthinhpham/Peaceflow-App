// Validated additions from the Ministry of Health clinical-procedure guideline.
// Tests requiring normative lookup tables, missing cutoffs, or custom scoring are excluded.
import group1 from './assessmentTests.group1.js';
import { TESTS as group2 } from './assessmentTests.group2.js';
import { TESTS as group3 } from './assessmentTests.group3.js';
import { TESTS as group4 } from './assessmentTests.group4.js';
import { GROUP5_TESTS as group5 } from './assessmentTests.group5.js';
import { TESTS as group6 } from './assessmentTests.group6.js';

export const ADDITIONAL_TESTS = { ...group1, ...group2, ...group3, ...group4, ...group5, ...group6 };
