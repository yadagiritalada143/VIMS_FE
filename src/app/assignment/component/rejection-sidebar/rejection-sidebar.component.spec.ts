import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { RejectionSidebarComponent } from './rejection-sidebar.component';

describe('RejectionSidebarComponent', () => {
  let component: RejectionSidebarComponent;
  let fixture: ComponentFixture<RejectionSidebarComponent>;
  CommonTestingModule.setUpTestBed(RejectionSidebarComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RejectionSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RejectionSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
