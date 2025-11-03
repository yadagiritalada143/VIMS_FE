import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PendingTimesheetsWidgetComponent } from './pending-timesheets-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ActiveHeadcountWidgetComponent', () => {
    let component: PendingTimesheetsWidgetComponent;
    let fixture: ComponentFixture<PendingTimesheetsWidgetComponent>;
    CommonTestingModule.setUpTestBed(PendingTimesheetsWidgetComponent);

    beforeEach(() => {
        fixture = TestBed.createComponent(PendingTimesheetsWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
