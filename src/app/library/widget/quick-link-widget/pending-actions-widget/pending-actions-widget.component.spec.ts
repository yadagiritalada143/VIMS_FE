import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PendingActionsWidgetComponent } from './pending-actions-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';


describe('PendingActionsWidgetComponent', () => {
    let component: PendingActionsWidgetComponent;
    let fixture: ComponentFixture<PendingActionsWidgetComponent>;
    CommonTestingModule.setUpTestBed(PendingActionsWidgetComponent);

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [PendingActionsWidgetComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PendingActionsWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
