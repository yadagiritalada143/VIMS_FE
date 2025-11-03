import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { UserAssignedComponent } from './user-assigned.component';

describe('UserAssignedComponent', () => {
  let component: UserAssignedComponent;
  let fixture: ComponentFixture<UserAssignedComponent>;
  CommonTestingModule.setUpTestBed(UserAssignedComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UserAssignedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserAssignedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
