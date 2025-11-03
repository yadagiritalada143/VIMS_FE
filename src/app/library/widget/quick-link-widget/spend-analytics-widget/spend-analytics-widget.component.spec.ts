import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SpendAnalyticsWidgetComponent } from './spend-analytics-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ActiveHeadcountWidgetComponent', () => {
    let component: SpendAnalyticsWidgetComponent;
    let fixture: ComponentFixture<SpendAnalyticsWidgetComponent>;
    CommonTestingModule.setUpTestBed(SpendAnalyticsWidgetComponent);

    beforeEach(() => {
        fixture = TestBed.createComponent(SpendAnalyticsWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
