import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramManageComponent } from './program-manage.component';

describe('ProgramManageComponent', () => {
  let component: ProgramManageComponent;
  let fixture: ComponentFixture<ProgramManageComponent>;
  CommonTestingModule.setUpTestBed(ProgramManageComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ProgramManageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramManageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
