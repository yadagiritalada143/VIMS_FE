import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { DayViewComponent } from './day-view.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('DayViewComponent', () => {
    let component: DayViewComponent;
    let fixture: ComponentFixture<DayViewComponent>;
    CommonTestingModule.setUpTestBed(DayViewComponent);

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [DayViewComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(DayViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
