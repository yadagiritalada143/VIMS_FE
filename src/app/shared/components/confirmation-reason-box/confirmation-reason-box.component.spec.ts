import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ConfirmationReasonBoxComponent } from './confirmation-reason-box.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
describe('ConfirmatinReasonBoxComponent', () => {
  let component: ConfirmationReasonBoxComponent;
  let fixture: ComponentFixture<ConfirmationReasonBoxComponent>;
  CommonTestingModule.setUpTestBed(ConfirmationReasonBoxComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfirmationReasonBoxComponent ],
      providers: [NgbActiveModal]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationReasonBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
