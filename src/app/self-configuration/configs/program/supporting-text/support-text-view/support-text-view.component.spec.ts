import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SupportTextViewComponent } from './support-text-view.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('SupportTextViewComponent', () => {
  let component: SupportTextViewComponent;
  let fixture: ComponentFixture<SupportTextViewComponent>;
  CommonTestingModule.setUpTestBed(SupportTextViewComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(SupportTextViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
