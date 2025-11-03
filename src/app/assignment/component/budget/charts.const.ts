import { BudgetChartColors, BudgetLabels } from "./budget.enums";
import { IBudgetChartColor } from "./budget.interfaces";

export const DonutColorScheme:any = [ BudgetChartColors.Violet, BudgetChartColors.Green, BudgetChartColors.Red ];

export const ColumnsColorScheme = [ BudgetChartColors.Blue, BudgetChartColors.DarkRed ];

export const DetailsChartColors: IBudgetChartColor[] = [
    { label: BudgetLabels.SpendApproved, color: BudgetChartColors.Green },
    { label: BudgetLabels.TotalRemaining, color: BudgetChartColors.Violet },
    { label: BudgetLabels.AwaitingApproval, color: BudgetChartColors.Red }
];

export const ApprovalChartColors: IBudgetChartColor[] = [
    { label: BudgetLabels.GeneralExpense, color: BudgetChartColors.Blue },
    { label: BudgetLabels.Timesheet, color: BudgetChartColors.DarkRed }
];