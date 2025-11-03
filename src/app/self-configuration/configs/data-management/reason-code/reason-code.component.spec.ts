import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReasonCodeComponent } from './reason-code.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ReasonCodeComponent', () => {
  let component: ReasonCodeComponent;
  let fixture: ComponentFixture<ReasonCodeComponent>;
  CommonTestingModule.setUpTestBed(ReasonCodeComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ReasonCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
