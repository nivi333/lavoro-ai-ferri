# Reports UI Refactoring - Implementation Plan

## Overview
This document outlines the refactoring of the Reports UI to use a **Tabbed Interface** for better usability and to consolidate similar reports. The goal is to reduce navigation friction, minimize the number of categories, and provide a seamless "one-click" experience for viewing related reports.

## Key Changes
1.  **Consolidated Categories**: Reduce the number of report categories to the absolute essentials:
    *   **Financial Reports**
    *   **Inventory Reports**
    *   **Sales Reports**
    *   **Operations Reports** (Merges Production & Operational & Quality)
2.  **Tabbed Interface**: Instead of multiple separate pages, each Category Page will contain a set of **Tabs**.
    *   Example: `FinancialReportsPage` will have tabs: [Profit & Loss] [Balance Sheet] [Cash Flow] ...
    *   This removes the need for "Card Navigation" -> "Detail Page".
    *   Users land directly on the report tables.
3.  **Dashboard Integration**: High-level summaries (Analytics) will be moved to the Dashboard widgets instead of a separate "Analytics" page, unless specific detailed analysis is needed.

## New Structure & Mappings

### 1. Financial Reports (`/reports/financial`)
*   **Tabs**:
    1.  **Profit & Loss**
    2.  **Balance Sheet**
    3.  **Cash Flow**
    4.  **GST Report**
    5.  **Expense Summary**
    *   *(Trial Balance, AP, AR moved to "More" or consolidation if needed, otherwise keep as tabs)*

### 2. Inventory Reports (`/reports/inventory`)
*   **Tabs**:
    1.  **Stock Summary** (Current Stock)
    2.  **Stock Movement** (In/Out/Transfer)
    3.  **Low Stock** (Alerts)
    4.  **Stock Valuation** (Value of stock)
    5.  **Stock Aging**

### 3. Sales Reports (`/reports/sales`)
*   **Tabs**:
    1.  **Sales Summary**
    2.  **Sales Trend**
    3.  **Top Products**
    4.  **Sales by Region**
    5.  **Customer History**

### 4. Operations Reports (`/reports/operations`)
*   *Merges Production, Operational, and Quality*
*   **Tabs**:
    1.  **Production Planning**
    2.  **Machine Utilization**
    3.  **Efficiency**
    4.  **Inspection Summary** (Quality)
    5.  **Downtime Analysis**

## Implementation Tasks

### 1. Refactor Category Pages
*   [x] **FinancialReportsPage.tsx**: Convert to Tabbed View. Import existing report *Components* (need to refactor Pages into Components).
*   [x] **InventoryReportsPage.tsx**: Convert to Tabbed View.
*   [x] **SalesReportsPage.tsx**: Convert to Tabbed View.
*   [x] **OperationsReportsPage.tsx**: Create new page, consolidate Production/Operational/Quality tabs.

### 2. Refactor Report Pages into Components
*   *Currently, logic is in `*Page.tsx` files. We should extract the content (Filters + Table) into `*Report.tsx` components to be rendered inside Tabs.*
*   [x] Extract `ProfitLossReport` from `ProfitLossReportPage`.
*   [x] Extract `StockSummaryReport` from `StockSummaryReportPage`.
*   [x] ...repeat for all reports.

### 3. Route Updates
*   [x] Update `frontend/src/router/AppRouter.tsx` to point `/reports/financial` to the new Tabbed page.
*   [x] Remove individual routes for report sub-pages.

### 4. Sidebar Updates
*   [x] Update `navigationConfig.ts` to show only the 4 main categories.
*   [x] Remove "Analytics", "Quality", "Production" from top-level sidebar if merged.

## Timeline
*   **Phase 1**: Extract Report Logic into Reusable Components.
*   **Phase 2**: Create Tabbed Container Pages.
*   **Phase 3**: Clean up Router and Sidebar.
