import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AddExpenseTypeComponent } from './add-expense-type.component';


describe('AddExpenseTypeComponent', () => {
    let component: AddExpenseTypeComponent;
    let fixture: ComponentFixture<AddExpenseTypeComponent>;
    CommonTestingModule.setUpTestBed(AddExpenseTypeComponent);
    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [AddExpenseTypeComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddExpenseTypeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
