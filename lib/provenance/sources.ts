/**
 * Sources Catalog — every real, citable reference used by the platform.
 * --------------------------------------------------------------------
 * Add an entry here BEFORE creating a verified DataPoint. The Source.id
 * is the contract: changing it requires explicitly updating every
 * downstream DataPoint that references it.
 *
 * Categories:
 *   - Aldar published documents (annual reports, ADX disclosures)
 *   - UAE regulators (CBUAE, SCA, ADREC)
 *   - International standards (ISO 31000, COSO ERM)
 *
 * IMPORTANT: only add a Source here if the underlying document is real
 * and publicly accessible. For demo-only data use SAMPLE_SOURCE from
 * ./types.ts instead.
 */

import type { Source } from './types'

// ============================================================
// ALDAR PUBLISHED DOCUMENTS
// ============================================================

export const SRC_ALDAR_FY24_AR: Source = {
  id: 'src.aldar.fy24.ar',
  kind: 'annual_report',
  title: 'Aldar Properties PJSC — FY2024 Integrated Annual Report',
  url: 'https://www.aldar.com/en/investor-relations/financial-information/annual-reports',
  fetchedAt: '2026-05-05',
  fetchedBy: 'system',
  note: 'Public investor document. Use only figures explicitly disclosed; do not interpolate.',
}

export const SRC_ALDAR_FY25_RESULTS: Source = {
  id: 'src.aldar.fy25.results',
  kind: 'annual_report',
  title: 'Aldar Properties PJSC — FY2025 Q4 Financial Results (announced Feb 2026)',
  url: 'https://www.aldar.com/en/news-and-media/aldar-q4-fy-2025-financial-results',
  fetchedAt: '2026-05-05',
  fetchedBy: 'system',
  note: 'Public press release. Group revenue AED 33.8B, EBITDA AED 11.2B, net profit AED 8.8B.',
}

export const SRC_ALDAR_Q1_2026: Source = {
  id: 'src.aldar.q1.2026',
  kind: 'adx_disclosure',
  title: 'Aldar Properties PJSC — Q1 FY2026 Financial Results (announced Apr 28, 2026)',
  url: 'https://www.aldar.com/en/news-and-media/aldar-q1-fy-2026-financial-results',
  fetchedAt: '2026-05-05',
  fetchedBy: 'system',
  note: 'Public Q1 release. Revenue AED 8.7B, EBITDA AED 3.0B, net profit AED 2.3B, backlog AED 72.1B.',
}

export const SRC_ALDAR_ADX_PROFILE: Source = {
  id: 'src.aldar.adx.profile',
  kind: 'adx_disclosure',
  title: 'ADX — Aldar Properties (ALDAR) Listed Company Profile',
  url: 'https://www.adx.ae/english/pages/productandservices/tradingservices/companyprofilepage.aspx?issuerid=158',
  fetchedAt: '2026-05-05',
  fetchedBy: 'system',
}

// ============================================================
// UAE REGULATORS
// ============================================================

export const SRC_CBUAE_RATES: Source = {
  id: 'src.cbuae.benchmark',
  kind: 'central_bank',
  title: 'Central Bank of the UAE — Base Rate & EIBOR References',
  url: 'https://www.centralbank.ae/en/our-operations/monetary-policy/eibor/',
  fetchedAt: '2026-05-05',
  fetchedBy: 'system',
}

export const SRC_ADREC_MARKET: Source = {
  id: 'src.adrec.market',
  kind: 'regulator',
  title: 'Abu Dhabi Real Estate Centre (ADREC) — Market Statistics',
  url: 'https://www.adrec.gov.ae/en/Open-Data',
  fetchedAt: '2026-05-05',
  fetchedBy: 'system',
}

// ============================================================
// INTERNATIONAL STANDARDS
// ============================================================

export const SRC_ISO_31000: Source = {
  id: 'src.iso.31000.2018',
  kind: 'standard',
  title: 'ISO 31000:2018 — Risk Management Guidelines',
  url: 'https://www.iso.org/standard/65694.html',
  note: 'Reference standard for risk management principles, framework, and process.',
}

export const SRC_COSO_ERM: Source = {
  id: 'src.coso.erm.2017',
  kind: 'standard',
  title: 'COSO Enterprise Risk Management — Integrating with Strategy and Performance (2017)',
  url: 'https://www.coso.org/erm-framework',
  note: 'Reference standard for enterprise risk management framework.',
}

// ============================================================
// REGISTRY — useful for debugging and the future provenance browser screen
// ============================================================

export const ALL_SOURCES: Source[] = [
  SRC_ALDAR_FY24_AR,
  SRC_ALDAR_FY25_RESULTS,
  SRC_ALDAR_Q1_2026,
  SRC_ALDAR_ADX_PROFILE,
  SRC_CBUAE_RATES,
  SRC_ADREC_MARKET,
  SRC_ISO_31000,
  SRC_COSO_ERM,
]
