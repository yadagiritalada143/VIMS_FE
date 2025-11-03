import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ActiveHeadcountWidgetComponent } from './active-headcount-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ActiveHeadcountWidgetComponent', () => {
    let component: ActiveHeadcountWidgetComponent;
    let fixture: ComponentFixture<ActiveHeadcountWidgetComponent>;
    CommonTestingModule.setUpTestBed(ActiveHeadcountWidgetComponent);

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ActiveHeadcountWidgetComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ActiveHeadcountWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
