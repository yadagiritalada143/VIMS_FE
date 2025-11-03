import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExpenseComponent } from './expense.component';
import { ExpensesListComponent } from './pages/expenses-list/expenses-list.component';
import { ExpenseDetailComponent } from './pages/expense-detail/expense-detail.component';
import { NewExpenseDetailsComponent } from './pages/new-expense-details/new-expense-details.component';
import { ExpenseRoutes } from './enums/expense.enums';
import { AuthguardService } from '../../app/core/services/auth_guard.service';

const routes: Routes = [
    {
        path: '',
        component: ExpenseComponent,
        children: [
            {
                path: '',
                redirectTo: ExpenseRoutes.General,
                pathMatch: 'full',
                canActivate: [AuthguardService],
                data: {
                    userRoles: ['view_expense'] 
                }
            },
            {
                path: `${ExpenseRoutes.General}/${ExpenseRoutes.NewExpense}`,
                canActivateChild: [AuthguardService],
                data: {
                    userRoles: ['create_expense']
                },
                children: [
                    {
                        path: ':assignmentId',
                        component: NewExpenseDetailsComponent,
                        canActivate: [AuthguardService],
                        data: {
                            userRoles: ['create_expense']
                        },
                    }
                ]
            },
            {
                path: `${ExpenseRoutes.Misc}/${ExpenseRoutes.NewExpense}`,
                canActivateChild: [AuthguardService],
                data: {
                    userRoles: ['create_misc_expense']
                },
                children: [
                    {
                        path: ':assignmentId',
                        component: NewExpenseDetailsComponent,
                        canActivate: [AuthguardService],
                        data: {
                            userRoles: ['create_misc_expense']
                        },
                    }
                ]
            },
            {
                path: `${ExpenseRoutes.General}/:status`,
                component: ExpensesListComponent,
                canActivate: [AuthguardService],
                data: {
                    userRoles: ['view_expense'] 
                }
            },
            {
                path: `${ExpenseRoutes.Misc}/:status`,
                component: ExpensesListComponent,
                canActivate: [AuthguardService],
                data: {
                    userRoles: ['view_misc_expense'] 
                }
            },
            {
                path: ExpenseRoutes.General,
                component: ExpensesListComponent,
                canActivate: [AuthguardService],
                data: {
                    userRoles: ['view_expense'] 
                }
            },
            {
                path: ExpenseRoutes.Misc,
                component: ExpensesListComponent,
                canActivate: [AuthguardService],
                data: {
                    userRoles: ['view_misc_expense'] 
                }
            },
            {
                path: ':expenseId',
                component: ExpenseDetailComponent
            },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})

export class ExpenseRoutingModule { }
