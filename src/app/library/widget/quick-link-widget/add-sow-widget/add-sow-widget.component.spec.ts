import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { AddSOWWidgetComponent } from './add-sow-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('AddSOWWidgetComponent', () => {
    let component: AddSOWWidgetComponent;
    let fixture: ComponentFixture<AddSOWWidgetComponent>;
    CommonTestingModule.setUpTestBed(AddSOWWidgetComponent);

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [AddSOWWidgetComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddSOWWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
