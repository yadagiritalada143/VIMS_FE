import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ResumeToReviewWidgetComponent } from './resume-to-review-widget.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ActiveHeadcountWidgetComponent', () => {
    let component: ResumeToReviewWidgetComponent;
    let fixture: ComponentFixture<ResumeToReviewWidgetComponent>;
    CommonTestingModule.setUpTestBed(ResumeToReviewWidgetComponent);

    beforeEach(() => {
        fixture = TestBed.createComponent(ResumeToReviewWidgetComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
