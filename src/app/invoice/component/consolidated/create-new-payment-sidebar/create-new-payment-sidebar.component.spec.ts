import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CreateNewPaymentSidebarComponent } from './create-new-payment-sidebar.component';
import { CommonTestingModule } from 'src/testing/commontest.module';


describe('CreateNewPaymentSidebarComponent', () => {
  let component: CreateNewPaymentSidebarComponent;
  let fixture: ComponentFixture<CreateNewPaymentSidebarComponent>;
  CommonTestingModule.setUpTestBed(CreateNewPaymentSidebarComponent);

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateNewPaymentSidebarComponent ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateNewPaymentSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

