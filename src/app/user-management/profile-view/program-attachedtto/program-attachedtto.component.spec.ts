import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { CommonTestingModule } from 'src/testing/commontest.module';
import { ProgramAttachedttoComponent } from './program-attachedtto.component';

describe('ProgramAttachedttoComponent', () => {
  let component: ProgramAttachedttoComponent;
  let fixture: ComponentFixture<ProgramAttachedttoComponent>;
  CommonTestingModule.setUpTestBed(ProgramAttachedttoComponent);
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramAttachedttoComponent],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramAttachedttoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
