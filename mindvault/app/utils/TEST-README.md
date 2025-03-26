# MindVault Persistence Testing Guide

This guide outlines how to test the persistence features implemented in the MindVault application.

## What to Test

Verify persistence across the following scenarios:

1. **Navigation within the app**
   - Select questions, add a title/description, and navigate to other sections
   - Return to the Investment Memo and verify all selections remain

2. **Page reloads**
   - Make changes to title, description, and selected questions
   - Reload the page and verify all changes persist
   - Answer some questions, reload, and verify answers persist

3. **Fast/Normal Mode**
   - Toggle between Fast and Normal modes
   - Reload the page and verify the mode selection persists

4. **Reset Functionality**
   - Test selective reset (reset only title, only questions, etc.)
   - Verify that non-selected items remain unchanged
   - Test the full reset functionality

5. **Custom Questions**
   - Add custom questions to a memo
   - Reload and verify they persist
   - Test selective reset - keep custom questions while resetting other elements

## Testing Procedure

1. **Initial State**
   - Open the application in a fresh browser session
   - Note the default state (no questions selected, default title)

2. **Make Changes**
   - Change the title to "Test Persistence"
   - Add a description
   - Select a template or individual questions
   - Toggle to Fast Mode (if it's not already)
   - Wait for some answers to be generated

3. **Test Navigation**
   - Navigate to other sections of the app
   - Return to the Investment Memo
   - Verify all changes persist

4. **Test Page Reload**
   - Reload the browser
   - Verify that all changes persist:
     - Title remains "Test Persistence"
     - Description remains unchanged
     - Selected questions remain selected
     - Generated answers remain visible
     - Fast Mode remains enabled

5. **Test Reset**
   - Click the Reset button
   - In the confirmation dialog, select only some elements to reset
   - Verify that only the selected elements are reset
   - Repeat with different combinations of reset options

## Edge Cases to Test

1. **Large Data Sets**
   - Test with a large number of questions and answers
   - Verify performance remains acceptable

2. **Browser Storage Limits**
   - Intentionally try to exceed browser storage limits
   - Verify graceful fallback behavior

3. **Multiple Tabs**
   - Open the application in multiple tabs
   - Make changes in one tab
   - Switch to another tab and reload
   - Verify changes persist across tabs

## Reporting Issues

If you encounter any issues during testing, please document:

1. The exact steps to reproduce the issue
2. The expected behavior
3. The actual behavior
4. Any error messages in the browser console
5. Browser and OS information

Submit this information to the development team for investigation. 