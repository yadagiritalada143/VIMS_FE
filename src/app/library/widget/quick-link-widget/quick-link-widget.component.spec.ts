import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { QuickLinkWidgetComponent } from './quick-link-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';


describe('QuickLinkWidgetComponent', () => {
    let component: QuickLinkWidgetComponent;
    let fixture: ComponentFixture<QuickLinkWidgetComponent>;
    CommonTestingModule.setUpTestBed(QuickLinkWidgetComponent);

    beforeEach(() => {
        fixture = TestBed.createComponent(QuickLinkWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
