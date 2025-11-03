import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReasonCodeDetailsComponent } from './reason-code-details.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ReasonCodeDetailsComponent', () => {
  let component: ReasonCodeDetailsComponent;
  let fixture: ComponentFixture<ReasonCodeDetailsComponent>;
  CommonTestingModule.setUpTestBed(ReasonCodeDetailsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ReasonCodeDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
