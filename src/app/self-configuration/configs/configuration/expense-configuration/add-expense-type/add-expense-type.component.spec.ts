import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AddExpenseTypeComponent } from './add-expense-type.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('AddExpenseTypeComponent', () => {
    let component: AddExpenseTypeComponent;
    let fixture: ComponentFixture<AddExpenseTypeComponent>;
    CommonTestingModule.setUpTestBed(AddExpenseTypeComponent);

    beforeEach(() => {
        fixture = TestBed.createComponent(AddExpenseTypeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
