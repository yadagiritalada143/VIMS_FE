import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CurrentOpeningsWidgetComponent } from './current-openings-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('CurrentOpeningsWidgetComponent', () => {
    let component: CurrentOpeningsWidgetComponent;
    let fixture: ComponentFixture<CurrentOpeningsWidgetComponent>;
    CommonTestingModule.setUpTestBed(CurrentOpeningsWidgetComponent);

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [CurrentOpeningsWidgetComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CurrentOpeningsWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
