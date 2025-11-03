import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActiveJobWidgetComponent } from './active-job-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ActiveHeadcountWidgetComponent', () => {
    let component: ActiveJobWidgetComponent;
    let fixture: ComponentFixture<ActiveJobWidgetComponent>;
    CommonTestingModule.setUpTestBed(ActiveJobWidgetComponent);

    beforeEach(() => {
        fixture = TestBed.createComponent(ActiveJobWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
