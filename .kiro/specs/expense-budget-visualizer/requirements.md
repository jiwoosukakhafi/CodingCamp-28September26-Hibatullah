# Requirements Document

## Introduction

The Expense & Budget Visualizer is a mobile-friendly, single-page web application that lets users record personal transactions (expenses), categorize them, view a live-updating total balance, and understand their spending distribution through an interactive pie chart. All data is persisted locally in the browser using the Local Storage API. The application is built with plain HTML, CSS, and Vanilla JavaScript — no frameworks or backend server required.

---

## Glossary

- **App**: The Expense & Budget Visualizer single-page web application.
- **Transaction**: A single expense entry consisting of an Item Name, an Amount, and a Category.
- **Item_Name**: A non-empty text label identifying the expense (e.g., "Lunch", "Bus fare").
- **Amount**: A positive numeric value representing the cost of a transaction in the user's local currency.
- **Category**: One of the three predefined spending groups: Food, Transport, or Fun.
- **Transaction_List**: The scrollable on-screen list that displays all recorded transactions.
- **Total_Balance**: The cumulative sum of all transaction Amounts currently stored, displayed at the top of the App.
- **Pie_Chart**: A Chart.js-powered circular chart that visualizes spending totals broken down by Category.
- **Input_Form**: The HTML form containing the Item_Name, Amount, and Category fields plus a Submit button.
- **Local_Storage**: The browser's Web Storage API used to persist transaction data client-side with no backend.
- **Delete_Button**: A per-transaction control that removes a single Transaction from the Transaction_List and Local_Storage.
- **Validator**: The client-side logic that checks Input_Form field values before a Transaction is recorded.

---

## Requirements

### Requirement 1: Transaction Input Form

**User Story:** As a user, I want to enter a transaction's name, amount, and category through a form, so that I can record my spending quickly.

#### Acceptance Criteria

1. THE App SHALL render the Input_Form containing an Item_Name text field accepting up to 100 characters, an Amount numeric field accepting values between 0.01 and 999999999.99, and a Category selector with exactly the options Food, Transport, and Fun.
2. WHEN the user submits the Input_Form, THE Validator SHALL check that the Item_Name field is not empty, the Amount field contains a numeric value between 0.01 and 999999999.99, and a Category option has been selected.
3. IF the Validator detects that Item_Name is empty or exceeds 100 characters, THEN THE App SHALL display an inline error message adjacent to the Item_Name field indicating the violation and SHALL NOT record the Transaction.
4. IF the Validator detects that Amount is empty, non-numeric, less than 0.01, or greater than 999999999.99, THEN THE App SHALL display an inline error message adjacent to the Amount field indicating the violation and SHALL NOT record the Transaction.
5. IF the Validator detects that no Category has been selected, THEN THE App SHALL display an inline error message adjacent to the Category selector indicating that a selection is required and SHALL NOT record the Transaction.
6. WHEN all fields pass validation, THE App SHALL add the Transaction to the Transaction_List and SHALL reset the Item_Name field to empty, the Amount field to empty, and the Category selector to its default unselected state within 100ms.
7. THE Input_Form SHALL be keyboard-accessible, allowing users to navigate between fields using the Tab key and submit the form using the Enter key without requiring mouse interaction.

---

### Requirement 2: Transaction List Display

**User Story:** As a user, I want to see all my recorded transactions in a scrollable list, so that I can review my spending history at a glance.

#### Acceptance Criteria

1. THE Transaction_List SHALL display every stored Transaction, showing the Item_Name, Amount, and Category for each entry, where Item_Name is truncated to a maximum of 50 characters if it exceeds that length.
2. WHILE the number of Transactions exceeds the visible area of the Transaction_List container, THE App SHALL allow the Transaction_List to scroll vertically without obscuring other page elements.
3. WHEN a new Transaction is added, THE Transaction_List SHALL display the new entry at the top of the Transaction_List within 500 milliseconds, without requiring a page reload.
4. THE Transaction_List SHALL render exactly one Delete_Button alongside each Transaction entry.
5. WHEN the user activates a Delete_Button, THE App SHALL remove the corresponding Transaction from the Transaction_List and from Local_Storage within 500 milliseconds.
6. IF the Transaction_List contains no stored Transactions, THEN THE App SHALL display a message indicating that no transactions have been recorded.
7. IF removal of a Transaction from Local_Storage fails, THEN THE App SHALL display an error message indicating the deletion failed and retain the Transaction in the Transaction_List.

---

### Requirement 3: Total Balance Display

**User Story:** As a user, I want to see the total of all my expenses at the top of the page, so that I always know how much I have spent in total.

#### Acceptance Criteria

1. THE App SHALL display the Total_Balance as the sum of all Transaction Amounts at the top of the viewport.
2. WHEN a Transaction is added, THE App SHALL recalculate and update the Total_Balance display within 500 milliseconds without a page reload.
3. WHEN a Transaction is deleted, THE App SHALL recalculate and update the Total_Balance display within 500 milliseconds without a page reload.
4. WHEN no Transactions exist, THE App SHALL display a Total_Balance of 0.00.
5. THE Total_Balance SHALL be formatted to two decimal places at all times.
6. IF any stored Transaction contains an invalid or non-numeric Amount, THEN THE App SHALL exclude that Transaction from the Total_Balance calculation and display the last valid calculated balance.

---

### Requirement 4: Pie Chart Visualization

**User Story:** As a user, I want to see a pie chart that breaks down my spending by category, so that I can understand where my money is going.

#### Acceptance Criteria

1. THE App SHALL render a Pie_Chart using the Chart.js library loaded from a CDN, requiring no local installation.
2. THE Pie_Chart SHALL display one segment per Category (Food, Transport, Fun), sized proportionally to the total Amount of all Transactions in that Category, where each segment's arc length corresponds to (category total / sum of all Transaction amounts) × 360 degrees.
3. WHEN a Transaction is added, THE App SHALL update the Pie_Chart to reflect the new category totals without a page reload.
4. WHEN a Transaction is deleted, THE App SHALL update the Pie_Chart to reflect the revised category totals without a page reload.
5. WHEN all Transactions are deleted, THE App SHALL display the Pie_Chart in an empty or placeholder state that does not throw a JavaScript error.
6. THE Pie_Chart SHALL display a legend or labels that identify each Category segment by name, where each label text matches exactly one of the defined Category names (Food, Transport, Fun).
7. IF a Category contains no Transactions, THEN THE App SHALL exclude that Category's segment from the Pie_Chart and its legend.
8. WHEN a Transaction is added or deleted, THE App SHALL complete the Pie_Chart update within 500 milliseconds of the triggering action.

---

### Requirement 5: Local Storage Persistence

**User Story:** As a user, I want my transactions to be saved locally, so that my data is not lost when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN a Transaction is added, THE App SHALL serialize the current Transaction_List as a JSON string and write it to Local_Storage under a fixed, predefined storage key.
2. WHEN a Transaction is deleted, THE App SHALL serialize the updated Transaction_List as a JSON string and write it to Local_Storage under the same fixed, predefined storage key.
3. WHEN the App initializes, THE App SHALL read and deserialize the Transaction_List from Local_Storage and display each stored Transaction as an entry in the Transaction_List view.
4. IF Local_Storage is empty or the stored value cannot be parsed as a valid JSON array of Transactions on initialization, THEN THE App SHALL initialize with an empty Transaction_List without throwing a JavaScript error.
5. THE App SHALL store all Transaction data exclusively in the browser's Local_Storage, with no Transaction data transmitted to any external server.
6. IF Local_Storage is unavailable or a write operation to Local_Storage fails, THEN THE App SHALL display an error message indicating that data could not be saved and the Transaction_List state from that point forward will not be persisted.

---

### Requirement 6: Mobile-Friendly Responsive Layout

**User Story:** As a user on a mobile device, I want the app layout to adapt to my screen size, so that I can use all features comfortably without horizontal scrolling.

#### Acceptance Criteria

1. WHILE the viewport width is below 600px, THE App SHALL render all content in a single column such that no horizontal scrollbar appears and all interactive elements are reachable by vertical scrolling only.
2. WHILE the viewport width is below 600px, THE App SHALL render all buttons and form controls with a minimum height of 44px and a minimum width of 44px.
3. THE App SHALL use relative units (rem, %, vh/vw) for all font sizes and layout dimensions across viewport widths from 320px to 1440px such that no content is clipped, overflows its container, or requires horizontal scrolling.
4. THE App SHALL render all pages without visual defects in the current stable release versions of Chrome, Firefox, Edge, and Safari on both desktop and mobile, where a visual defect is defined as overlapping elements, clipped content, or broken layout.
5. WHILE the viewport width is between 600px and 1440px, THE App SHALL adapt the layout from single-column to multi-column using defined breakpoints at 600px and 1024px, such that no content overflows its container at any width within that range.

---

### Requirement 7: Code Structure and Performance

**User Story:** As a developer, I want the codebase to follow a clean, single-file-per-type structure, so that the project is easy to maintain and load quickly.

#### Acceptance Criteria

1. THE App SHALL consist of exactly one HTML file, one CSS file located in a `css/` directory, and one JavaScript file located in a `js/` directory.
2. THE App SHALL load and become interactive, defined as the point at which the user can input a Transaction and receive a UI response, in under 3 seconds when measured on a connection with a download speed of at least 25 Mbps and with no server-side processing involved.
3. WHEN a Transaction is added or deleted, THE App SHALL update the Total_Balance, Transaction_List, and Pie_Chart within 100 milliseconds, measured from the moment the user confirms the action (e.g., submits the form or clicks delete) to the moment all three UI elements reflect the change.
4. THE App SHALL use only Vanilla JavaScript with no client-side frameworks (such as React, Vue, or Angular) and no third-party JavaScript libraries, with the exception of a charting library used solely to render the Pie_Chart.
5. THE App SHALL require no build tools, package managers, or local server setup to run; opening the HTML file directly in a browser SHALL be sufficient.
6. IF the total number of Transactions stored in Local_Storage exceeds 1000 entries, THEN THE App SHALL still update the Total_Balance, Transaction_List, and Pie_Chart within 100 milliseconds of the user action.
