// English text for the validated additions. Scoring keys remain identical to Vietnamese.
import group1 from './assessmentTests.group1.en.js';
import { TESTS as group2 } from './assessmentTests.group2.en.js';
import { TESTS as group3 } from './assessmentTests.group3.en.js';
import { TESTS as group4 } from './assessmentTests.group4.en.js';
import { GROUP5_TESTS as group5 } from './assessmentTests.group5.en.js';
import { TESTS as group6 } from './assessmentTests.group6.en.js';

export const ADDITIONAL_TESTS = { ...group1, ...group2, ...group3, ...group4, ...group5, ...group6 };
