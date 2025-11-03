import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PendingExpensesWidgetComponent } from './pending-expenses-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ActiveHeadcountWidgetComponent', () => {
    let component: PendingExpensesWidgetComponent;
    let fixture: ComponentFixture<PendingExpensesWidgetComponent>;
    CommonTestingModule.setUpTestBed(PendingExpensesWidgetComponent);

    beforeEach(() => {
        fixture = TestBed.createComponent(PendingExpensesWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
