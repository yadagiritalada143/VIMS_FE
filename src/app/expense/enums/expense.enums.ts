import { ApprovalStatus, ExpenseStatus } from "src/app/shared/enums";

export enum ExpenseType {
    Expense = 'expense',
    MiscExpense = 'misc_expense'
}

export enum ExpenseNames {
    Expense = 'General',
    MiscExpense = 'Miscellaneous'
}

export enum ExpenseRoutes {
    Root = 'expense',
    General = 'general',
    NewExpense = 'new-expense',
    Misc = 'misc',
}


export enum UserType {
    Worker = 'CANDIDATE',
    Vendor = 'VENDOR',
    MSP = 'MSP',
    Client = 'CLIENT',
    Super_org = 'SUPER_ORG'
}

export enum AttachmentExtension {
    PNG = 'png',
    PDF = 'pdf',
    DOCX = 'docx',
    DOC = 'doc',
    EXEL = 'exel',
    JPG = 'jpg'
}

export enum ReasonCode {
    WithdrawExpense = 'WITHDRAW_EXPENSE',
    RejectExpense = 'REJECT_EXPENSE',
    ModifyExpense = 'MODIFY_EXPENSE',
    DeleteExpense = 'DELETE_EXPENSE'
}

export enum Permissions {
    ADMIN_OVERRIDE_ON_APPROVAL= 'admin_override_on_approval'
}

export const ExpenseStatusMessage = { ...ApprovalStatus, ...ExpenseStatus };

export const NavigationPaths = {
    root: () => `/`,
    user: {
        generalList: () => `/${ExpenseRoutes.Root}/${ExpenseRoutes.General}`,
        miscList: () => `/${ExpenseRoutes.Root}/${ExpenseRoutes.Misc}`,
        generalListItemDetails: (expenseId) => `/${ExpenseRoutes.Root}/${expenseId}`,
        generalNewItemDetails: (assignmentId: string) =>
            `/${ExpenseRoutes.Root}/${ExpenseRoutes.General}/${ExpenseRoutes.NewExpense}/${assignmentId}`,
        miscNewItemDetails: (assignmentId: string) =>
            `/${ExpenseRoutes.Root}/${ExpenseRoutes.Misc}/${ExpenseRoutes.NewExpense}/${assignmentId}`,
    },
};

