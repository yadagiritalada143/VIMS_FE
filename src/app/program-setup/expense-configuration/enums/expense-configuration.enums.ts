
export enum ExpenseConfigurationRoutes {
    Root = 'expense-config',
    List = 'list',
    Details = 'details'
}

export const NavigationPaths = {
    root: () => `/`,
    user: {
        expenseConfigurationDetails: () => `/${ExpenseConfigurationRoutes.Root}/${ExpenseConfigurationRoutes.Details}`,
    }
};
