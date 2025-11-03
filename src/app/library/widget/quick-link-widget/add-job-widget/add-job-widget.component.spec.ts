import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AddJobWidgetComponent } from './add-job-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';


describe('AddJobWidgetComponent', () => {
    let component: AddJobWidgetComponent;
    let fixture: ComponentFixture<AddJobWidgetComponent>;
    CommonTestingModule.setUpTestBed(AddJobWidgetComponent);

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [AddJobWidgetComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddJobWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
