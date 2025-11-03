import { ChartTypes, WidgetCategories, Widgets, WidgetSizes } from '../widget.types'
import { IChartWidget } from '../widget.interfaces'
import { widgetIcons } from '../widget-icons.config';


// --- MOCKUP WIDGETS --- //

const chartHeadcount: IChartWidget = {
  label: 'Headcount',
  category: WidgetCategories.Charts,
  name: Widgets.ChartHeadcount,
  api: '/report/programs/<PROGRAM_ID>/headcount-location',
  link: '/',
  ...widgetIcons[Widgets.ChartHeadcount],
  isActive: false,
  isExpandable: true,
  height: 10,
  width: 6,
  minHeight: 5,
  maxHeight: 12,
  minWidth: 3,
  maxWidth: 12,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placeholder: 'Enter Label'
    },
    dimension: {
      placeholder: 'Choose Type',
      labels: 'Location|Category',
      values: 'Location|Category'
    },
    chartType: {
      placeholder: 'Choose Chart Type',
      icons: 'bar_chart|subject|pie_chart|show_chart|donut_large|language',
      labels: 'Vertical|Horizontal|Pie|Line|Donut|US Map',
      values: 'vertical|horizontal|pie|line|donut|map'
    }
  }
}

const chartSpendBySupplier: IChartWidget = {
  label: 'Spend By Supplier',
  category: WidgetCategories.Charts,
  name: Widgets.ChartSpendBySupplier,
  defaultChartType: ChartTypes.Bubble,
  api: '',
  link: '/',
  ...widgetIcons[Widgets.ChartSpendBySupplier],
  isActive: false,
  isExpandable: true,
  height: 18,
  width: 8,
  minHeight: 12,
  maxHeight: 20,
  minWidth: 5,
  maxWidth: 19,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    },
    periodicity: {
      labels: 'Last 7 Days|Last 30 Days|Last 3 Months|Last 6 Months|Choose Custom Date',
      placeholder: 'Select Periodicity',
      values: '7 days|30 days|3 months|6 months|0'
    },
    range: {
      labels: 'Choose Date Range'
    }
  }
}

const chartSpendByCategory: IChartWidget = {
  label: 'Spend By Category',
  category: WidgetCategories.Charts,
  name: Widgets.ChartSpendByCategory,
  defaultChartType: ChartTypes.Bubble,
  api: '',
  link: '/',
  ...widgetIcons[Widgets.ChartSpendByCategory],
  isActive: false,
  isExpandable: true,
  height: 18,
  width: 8,
  minHeight: 12,
  maxHeight: 20,
  minWidth: 5,
  maxWidth: 12,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    },
    periodicity: {
      labels: 'Last 7 Days|Last 30 Days|Last 3 Months|Last 6 Months|Choose Custom Date',
      placeholder: 'Select Periodicity',
      values: '7 days|30 days|3 months|6 months|0'
    },
    range: {
      labels: 'Choose Date Range'
    }
  }
}

const chartSpendByCandidate: IChartWidget = {
  label: 'Spend By Candidate',
  category: WidgetCategories.Charts,
  name: Widgets.ChartSpendByCandidate,
  defaultChartType: ChartTypes.Horizontal,
  api: '',
  link: '/',
  ...widgetIcons[Widgets.ChartSpendByCandidate],
  isActive: false,
  isExpandable: true,
  height: 10,
  width: 6,
  minHeight: 6,
  maxHeight: 12,
  minWidth: 5,
  maxWidth: 12,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
}

const chartJobReport: IChartWidget = {
  label: 'Job Report',
  category: WidgetCategories.Charts,
  name: Widgets.ChartJobReport,
  api: '',
  link: '/',
  ...widgetIcons[Widgets.ChartJobReport],
  isActive: false,
  isExpandable: true,
  height: 10,
  width: 6,
  minHeight: 5,
  maxHeight: 12,
  minWidth: 3,
  maxWidth: 12,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placeholder: 'Enter Label'
    },
    dimension: {
      placeholder: 'Choose Dimension',
      labels: 'Type|Status|Category',
      values: 'Type|Status|Category'
    },
    chartType: {
      placeholder: 'Choose Chart Type',
      icons: 'bar_chart|subject|pie_chart|show_chart|donut_large',
      labels: 'Vertical|Horizontal|Pie|Line|Donut',
      values: 'vertical|horizontal|pie|line|donut'
    }
  }
}

const chartBudgetSpend: IChartWidget = {
  label: 'Budget Spend',
  category: WidgetCategories.Charts,
  name: Widgets.ChartBudgetSpend,
  defaultChartType: ChartTypes.Donut,
  api: '',
  link: '/',
  ...widgetIcons[Widgets.ChartBudgetSpend],
  isActive: false,
  isExpandable: true,
  height: 8,
  width: 4,
  minHeight: 6,
  maxHeight: 10,
  minWidth: 3,
  maxWidth: 6,
  filters: [],
  size: WidgetSizes.Medium,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
}

const chartDailySpend: IChartWidget = {
  label: 'Daily Spend',
  category: WidgetCategories.Charts,
  name: Widgets.ChartDailySpend,
  defaultChartType: ChartTypes.Spiral,
  api: '',
  link: '/',
  ...widgetIcons[Widgets.ChartDailySpend],
  isActive: false,
  isExpandable: true,
  height: 10,
  width: 6,
  minHeight: 5,
  maxHeight: 16,
  minWidth: 3,
  maxWidth: 12,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
}

const chart_RT_OT_Expense: IChartWidget = {
  label: 'RT, OT & Expense',
  category: WidgetCategories.Charts,
  name: Widgets.Chart_RT_OT_Expense,
  api: '',
  link: '/',
  ...widgetIcons[Widgets.Chart_RT_OT_Expense],
  isActive: false,
  isExpandable: true,
  height: 10,
  width: 6,
  minHeight: 5,
  maxHeight: 12,
  minWidth: 3,
  maxWidth: 12,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label',
    },
    dimension: {
      labels: 'Category|Vendor|Location',
      placeholder: 'Choose Dimension',
      values: 'Category|Vendor|Location'
    },
    chartType: {
      icons: 'bar_chart|subject',
      labels: 'Vertical|Horizontal',
      placeholder: 'Choose Chart Type',
      values: 'vertical|horizontal'
    }
  }
}

const chartSpendByYear: IChartWidget = {
  label: 'Spend By Year',
  category: WidgetCategories.Charts,
  name: Widgets.ChartSpendByYear,
  defaultChartType: ChartTypes.Treemap,
  api: '',
  link: '/',
  ...widgetIcons[Widgets.ChartSpendByYear],
  isActive: false,
  isExpandable: true,
  height: 8,
  width: 5,
  minHeight: 6,
  maxHeight: 12,
  minWidth: 3,
  maxWidth: 12,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    }
  }
}

const chartTenureReport: IChartWidget = {
  label: 'Tenure Report',
  category: WidgetCategories.Charts,
  name: Widgets.ChartTenureReport,
  api: '',
  link: '/',
  ...widgetIcons[Widgets.ChartTenureReport],
  isActive: false,
  isExpandable: true,
  height: 10,
  width: 6,
  minHeight: 5,
  maxHeight: 12,
  minWidth: 3,
  maxWidth: 12,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    },
    dimension: {
      placeholder: 'Choose Dimension',
      labels: 'Months|Vendor|Category|Location|Terminated',
      values: 'Months|Vendor|Category|Location|Terminated',
    },
    chartType: {
      placeholder: 'Choose Chart Type',
      icons: 'bar_chart|subject',
      labels: 'Vertical|Horizontal',
      values: 'vertical|horizontal'
    }
  }
}

const chartSpendOverTime: IChartWidget = {
  label: 'Spend Over Time',
  category: WidgetCategories.Charts,
  name: Widgets.ChartSpendOverTime,
  defaultChartType: ChartTypes.Bubble,
  api: '',
  link: '/',
  ...widgetIcons[Widgets.ChartSpendOverTime],
  isActive: false,
  isExpandable: true,
  height: 10,
  width: 12,
  minHeight: 6,
  maxHeight: 12,
  minWidth: 6,
  maxWidth: 19,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    },
    periodicity: {
      labels: 'Last 7 Days|Last 30 Days|Last 3 Months|Last 6 Months|Choose Custom Date',
      placeholder: 'Select Periodicity',
      values: '7 days|30 days|3 months|6 months|0'
    },
    range: {
      labels: 'Choose Date Range'
    }
  }
}

const chartSpendReport: IChartWidget = {
  label: 'Spend Report',
  category: WidgetCategories.Charts,
  name: Widgets.ChartSpendReport,
  chartType: ChartTypes.Vertical,
  api: '',
  link: '/',
  ...widgetIcons[Widgets.ChartSpendReport],
  isActive: false,
  isExpandable: true,
  height: 10,
  width: 6,
  minHeight: 5,
  maxHeight: 12,
  minWidth: 3,
  maxWidth: 12,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    },
    dimension: {
      placeholder: 'Choose Dimension',
      labels: 'Category|Vendor|Location|Spend Type',
      values: 'Category|Vendor|Location|Type',
    },
    chartType: {
      placeholder: 'Choose Chart Type',
      icons: 'bar_chart|subject|pie_chart|show_chart|donut_large',
      labels: 'Vertical|Horizontal|Pie|Line|Donut',
      values: 'vertical|horizontal|pie|line|donut'
    }
  }
}

const chartCandidateByOT: IChartWidget = {
  label: 'Candidate By OT',
  category: WidgetCategories.Charts,
  name: Widgets.ChartCandidateByOT,
  api: '',
  link: '/',
  ...widgetIcons[Widgets.ChartCandidateByOT],
  isActive: false,
  isExpandable: true,
  height: 10,
  width: 6,
  minHeight: 5,
  maxHeight: 12,
  minWidth: 3,
  maxWidth: 12,
  filters: [],
  size: WidgetSizes.Large,
  userType: ['CLIENT', 'MSP', 'VENDOR', 'CANDIDATE', 'SUPER_ORG'],
  formData: {
    label: {
      placholder: 'Enter Label'
    },
    chartType: {
      placeholder: 'Choose Chart Type',
      icons: 'bar_chart|subject',
      labels: 'Vertical|Horizontal',
      values: 'vertical|horizontal'
    }
  }
}

export const chartWidgetsConfig = {
  [Widgets.ChartBudgetSpend]: chartBudgetSpend,
  [Widgets.ChartCandidateByOT]: chartCandidateByOT,
  [Widgets.ChartDailySpend]: chartDailySpend,
  [Widgets.ChartHeadcount]: chartHeadcount,
  [Widgets.ChartJobReport]: chartJobReport,
  [Widgets.ChartSpendByCandidate]: chartSpendByCandidate,
  [Widgets.ChartSpendByCategory]: chartSpendByCategory,
  [Widgets.ChartSpendBySupplier]: chartSpendBySupplier,
  [Widgets.ChartSpendByYear]: chartSpendByYear,
  [Widgets.ChartSpendOverTime]: chartSpendOverTime,
  [Widgets.ChartSpendReport]: chartSpendReport,
  [Widgets.ChartTenureReport]: chartTenureReport,
  [Widgets.Chart_RT_OT_Expense]: chart_RT_OT_Expense
}