import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { NotificationCardsComponent } from './notification-cards.component';

describe('NotificationCardsComponent', () => {
  let component: NotificationCardsComponent;
  let fixture: ComponentFixture<NotificationCardsComponent>;
  CommonTestingModule.setUpTestBed(NotificationCardsComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NotificationCardsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotificationCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
