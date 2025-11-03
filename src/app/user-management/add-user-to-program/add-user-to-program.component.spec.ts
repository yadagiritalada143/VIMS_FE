import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { AddUserToProgramComponent } from './add-user-to-program.component';

describe('AddUserToProgramComponent', () => {
  let component: AddUserToProgramComponent;
  let fixture: ComponentFixture<AddUserToProgramComponent>;
  CommonTestingModule.setUpTestBed(AddUserToProgramComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [AddUserToProgramComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddUserToProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
