export const accuracyConfig: Array<any> = [
  {
    main_scope: 'rate',
    main_scope_label: 'rate',
    scopes: ['rate'],
  },
  {
    main_scope: 'markup',
    main_scope_label: 'markup',
    scopes: ['markup', 'markup_percentage'],
  },
  {
    main_scope: 'fee',
    main_scope_label: 'fee',
    scopes: ['fee', 'fee_percentage'],
  },
  {
    main_scope: 'amount',
    main_scope_label: 'amount',
    scopes: ['amount', 'amount_percentage'],
  },
  {
    main_scope: 'tax',
    main_scope_label: 'tax',
    scopes: ['tax', 'tax_percentage'],
  },
  {
    main_scope: 'adjustment',
    main_scope_label: 'adjustment',
    scopes: ['adjustment'],
  },
  {
    main_scope: 'hour',
    main_scope_label: 'unit of duration',
    scopes: ['hour'],
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
