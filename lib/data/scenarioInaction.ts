/**
 * Shared scenario coefficients — single source of truth.
 * --------------------------------------------------------
 * The Exposure Bridge (ExposureClimax) and the Cost-of-Inaction headline
 * (CostOfInactionPanel) MUST tell one consistent story. Previously each
 * hard-coded its own multiplier (1.7× / 2.41× vs 0.42×), so the same page
 * showed two different "cost of inaction" figures. Both now import these.
 *
 * Illustrative / pre-pilot: directional coefficients, not calibrated model
 * outputs. Pilot replaces them with the simulation engine's scenario results.
 * (Honors CLAUDE.md — labelled illustrative wherever rendered.)
 */
import { BASELINE_RISK_POSTURE } from '@/lib/data/baselineRiskPosture'

/** Net unhedged exposure today (baseline). */
export const BASELINE_EXPOSURE = BASELINE_RISK_POSTURE.netUnhedgedExposure

/** Severe-shock multiplier applied to the baseline (illustrative). */
export const STRESS_MULTIPLIER = 1.7

/** 12-month "do nothing" exposure multiplier (illustrative). */
export const INACTION_MULTIPLIER = 2.41

/** Exposure under a severe combined shock. */
export const STRESSED_EXPOSURE = BASELINE_EXPOSURE * STRESS_MULTIPLIER

/** Projected 12-month exposure if no mitigating action is taken. */
export const INACTION_EXPOSURE = BASELINE_EXPOSURE * INACTION_MULTIPLIER

/**
 * Cost of inaction = the 12-month deterioration vs. baseline — i.e. exactly
 * what acting now avoids. This is the ONE number both panels display.
 */
export const COST_OF_INACTION = INACTION_EXPOSURE - BASELINE_EXPOSURE
