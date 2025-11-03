export const accuracyConfig: Array<any> = [
  {
    main_scope: 'rate',
    main_scope_label: 'rate',
    scopes: ['rate'],
    supporting_text:
      'When \'Rate\' is defined, the system applies defined accuracy values to native rate fields such as Min and Max Bill Rates, Client and Vendor Bill Rates, and Pay Rates (if applicable for the program).',
  },
  {
    main_scope: 'markup',
    main_scope_label: 'markup',
    scopes: ['markup', 'markup_percentage'],
    supporting_text: 'When \'Markup\' is defined, the system applies defined accuracy values to the Markup.',
  },
  {
    main_scope: 'fee',
    main_scope_label: 'fee',
    scopes: ['fee', 'fee_percentage'],
    supporting_text:
      'When \'Fee\' is defined, the system applies defined accuracy values to fees such as the VMS, MSP, and MSP Partner Fee. Note that \'Amount\' accuracy is referenced for fee amounts in Timesheet, Expense, and Invoice modules.',
  },
  {
    main_scope: 'amount',
    main_scope_label: 'amount',
    scopes: ['amount', 'amount_percentage'],
    supporting_text:
      'When \'Amount (Fixed)\' is defined, the system applies the defined accuracy values for calculated amounts such as estimated budget on Jobs, budget amounts on Assignments, Timesheet amounts, and invoice amounts like Client Amount, Vendor Amount, etc. When \'Amount (Percentage)\' is defined, the system applies the defined accuracy values when calculating additional budget using percent on Jobs, for example.',
  },
  {
    main_scope: 'tax',
    main_scope_label: 'tax',
    scopes: ['tax', 'tax_percentage'],
    supporting_text:
      'When \'Tax (Fixed)\' is defined, the system applies defined accuracy values to tax fields such as Estimated Tax. When \'Tax (Percentage)\' is defined, the system applies defined accuracy values to tax fields such as Tax Percentage. Note that \'Amount\' accuracy is referenced for tax amounts in Timesheet, Expense, and Invoice modules.',
  },
  {
    main_scope: 'adjustment',
    main_scope_label: 'adjustment',
    scopes: ['adjustment'],
    supporting_text:
      'When \'Adjustment (Fixed)\' is defined, the system applies defined accuracy values to Adjustment amounts. Note that \'Amount\' accuracy is referenced for adjustment amounts in Timesheet, Expense, and Invoice modules.',
  },
  {
    main_scope: 'hour',
    main_scope_label: 'Unit of_measure',
    scopes: ['hour'],
    supporting_text: 'When \'Unit of Measure\' is defined, the system applies the defined accuracy values for units such as \'Hours\' or \'Days\'.',
  },
];

export const scaling_type: Array<any> = [
  {
    value: 'round_down',
    name: 'Round Down',
  },
  {
    value: 'round_up',
    name: 'Round Up',
  },
  {
    value: 'truncate',
    name: 'Truncate',
  },
];
