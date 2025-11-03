import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgramDetailsComponent } from './program-details.component';
import { CommonTestingModule } from 'src/testing/commontest.module';

describe('ProgramDetailsComponent', () => {
  let component: ProgramDetailsComponent;
  let fixture: ComponentFixture<ProgramDetailsComponent>;
  CommonTestingModule.setUpTestBed(ProgramDetailsComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgramDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
