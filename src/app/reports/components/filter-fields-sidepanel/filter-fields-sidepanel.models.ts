import { ComparisonOperators, ComparisonTypes, IComparisonOperators } from './filter-fields-sidepanel.interfaces'

export const ComparisonOperatorsList: IComparisonOperators = {
  [ComparisonTypes.Number]: [
    { id: ComparisonOperators.EqualTo, label: '=' },
    { id: ComparisonOperators.GreaterThan, label: '>' },
    { id: ComparisonOperators.GreaterThanOrEqualTo, label: '>=' },
    { id: ComparisonOperators.LessThanOrEqualTo, label: '<=' },
    { id: ComparisonOperators.LessThan, label: '<' }
  ],
  [ComparisonTypes.String]: [
    { id: ComparisonOperators.In, label: 'IN' },
    { id: ComparisonOperators.IsNot, label: 'IS NOT' },
  ],
  [ComparisonTypes.Date]: [
    { id: ComparisonOperators.After, label: 'After X' },
    { id: ComparisonOperators.Before, label: 'Before X' },
    { id: ComparisonOperators.Between, label: 'Between X,Y' },
    { id: ComparisonOperators.InLast, label: 'In Last X' },
    { id: ComparisonOperators.NotBetween, label: 'Not Between X,Y' },
    { id: ComparisonOperators.NotOn, label: 'Not On X' },
    { id: ComparisonOperators.On, label: 'On X' }
  ]
}

export const FieldTypes = {
  assignment_code: ComparisonTypes.String,
  assignment_manager: ComparisonTypes.String, 
  bill_rate: ComparisonTypes.Number,
  end_date: ComparisonTypes.Date,
  location_name: ComparisonTypes.String,  
  project_or_support_code: ComparisonTypes.String,
  project_or_support_po: ComparisonTypes.String,
  start_date: ComparisonTypes.Date,
  status: ComparisonTypes.String,
  vendor: ComparisonTypes.String,
  worker_email: ComparisonTypes.String, 
  worker_name: ComparisonTypes.String
}


