import { Injectable } from '@angular/core';
import { StorageKeys, StorageService } from 'src/app/core/services/storage.service';
import { IExpenseType } from './interfaces/expense.interfaces';
import { BehaviorSubject } from 'rxjs';
import { ExpenseType, ExpenseRoutes } from './enums/expense.enums';
import { HttpService } from '../core/services/http.service';
import { map } from 'rxjs/internal/operators/map';
import { AssignmentDetails } from './models/assignment.model';
import { IExpenseResponse } from './interfaces/expense-data.interfaces';

@Injectable({
    providedIn: 'root'
})
export class ExpenseService {
    private expenseUrl = '/expense/programs/';
    private expenseType = new BehaviorSubject<IExpenseType>({ value: ExpenseType.Expense, name: 'General Expense' });

    public expenseType$ = this.expenseType.asObservable();

    constructor(private http: HttpService, private storageService: StorageService) { }

    public init() {
    }

    public setExpenseType(type: IExpenseType) {
        this.expenseType.next(type);
    }

    public getAssignmentDetails(programId: string, assignmentId: string) {
        return this.http.get(`/assignment/programs/${programId}/assignment/${assignmentId}?is_assignment_show=expense`).pipe(
            map((res: IExpenseResponse<{ assignments: AssignmentDetails }>) => res.data.assignments
        ));
    }
    public addModifyExpenseReason(expenseId: string, payload) {
        const programId = this.storageService.get(StorageKeys.PROGRAM_ID);
        return this.http.put(this.expenseUrl + `${programId}/modify-expense-reason/${expenseId}`, payload);
    }

    public getWorkerAssignment(workerId: string, expenseType:string) {
        const programId = this.storageService.get(StorageKeys.PROGRAM_ID);
        if(expenseType?.toLowerCase() == ExpenseType?.Expense?.toLowerCase()){
            return this.http.get(`/expense/programs/${programId}/worker/${workerId}/assignment?expense_type=${ExpenseType.Expense}`);
        }else{
            return this.http.get(`/expense/programs/${programId}/worker/${workerId}/assignment?expense_type=${ExpenseType.MiscExpense}`);
        }
    }

    public getWorkersList(searchText = '', expenseType: string, page = 1) {
        const programId = this.storageService.get(StorageKeys.PROGRAM_ID);
        if(expenseType?.toLowerCase() == ExpenseType?.Expense?.toLowerCase()){
            if (!!searchText) {
                return this.http.get(`/assignment/programs/${programId}/worker?limit=25&page=${page}&search=${searchText}&expense_type=${ExpenseRoutes?.General?.toLowerCase()}`);
            } else {
                return this.http.get(`/assignment/programs/${programId}/worker?limit=25&page=${page}&expense_type=${ExpenseRoutes?.General?.toLowerCase()}`);
            }
        }
        else {
            if (!!searchText) {
                return this.http.get(`/assignment/programs/${programId}/worker?limit=25&page=${page}&search=${searchText}&expense_type=${ExpenseRoutes?.Misc?.toLowerCase()}`);
            }
            else {
                return this.http.get(`/assignment/programs/${programId}/worker?limit=25&page=${page}&expense_type=${ExpenseRoutes?.Misc?.toLowerCase()}`);
            }
        }
    }

    populateCustomFields(assignment, expense) {
        if (assignment && expense) {
            Object.keys(assignment)?.forEach(function (key) {
                Object.keys(expense)?.forEach(function (key1) {
                    if ((key === key1) && !expense[key]) {
                        expense[key] = assignment[key];
                    }
                });
            });
        }
        if (JSON.stringify(expense) === "{}" || (Array?.isArray(expense) && expense?.length === 0)) {
            return assignment;
        }
        return expense
    }

    public getDefaultDateFormat(){
        return  this.storageService.get(StorageKeys.CURRENT_PROGRAM)?.defaultDateFormat.toUpperCase();
     } 
    encodeToBase64(filedata) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(filedata);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
     getExpenseMasterData(currentExpenseData:any) {
        const currentProgram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
        const _url = `/expense/programs/${currentProgram?.id}/default-config/${currentExpenseData?.hierarchy?.id}`;
        return this.http.get(_url).pipe(map(
          data => {
            return data;
          }
        ));
      }
      
      getExpenseMasterDataValues(currentExpenseData:any) {
        const currentProgram = this.storageService.get(StorageKeys?.CURRENT_PROGRAM);
        var _url = `/expense/programs/${currentProgram?.id}/expense/header/information?assignment_uuid=${currentExpenseData?.assignment?.id}`
        if(currentExpenseData?.expense_id){
             _url = `/expense/programs/${currentProgram?.id}/expense/header/information?expense_uuid=${currentExpenseData?.expense_id}&assignment_uuid=${currentExpenseData?.assignment?.id}`;
        }
        return this.http.get(_url).pipe(map(
          data => {
            return data;
          }
        ));
      }

}
