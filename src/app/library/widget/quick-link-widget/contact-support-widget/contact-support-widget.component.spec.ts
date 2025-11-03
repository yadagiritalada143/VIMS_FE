import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ContactSupportWidgetComponent } from './contact-support-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ContactSupportWidgetComponent', () => {
    let component: ContactSupportWidgetComponent;
    let fixture: ComponentFixture<ContactSupportWidgetComponent>;
    CommonTestingModule.setUpTestBed(ContactSupportWidgetComponent);

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ContactSupportWidgetComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ContactSupportWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
