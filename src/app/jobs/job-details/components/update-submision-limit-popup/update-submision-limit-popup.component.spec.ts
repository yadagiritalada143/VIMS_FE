import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { UpdateSubmisionLimitPopupComponent } from './update-submision-limit-popup.component';

describe('UpdateSubmisionLimitPopupComponent', () => {
  let component: UpdateSubmisionLimitPopupComponent;
  let fixture: ComponentFixture<UpdateSubmisionLimitPopupComponent>;
  CommonTestingModule.setUpTestBed(UpdateSubmisionLimitPopupComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateSubmisionLimitPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateSubmisionLimitPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
